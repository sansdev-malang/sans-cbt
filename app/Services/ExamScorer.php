<?php

namespace App\Services;

use App\Models\ExamSession;
use App\Models\Question;
use App\Models\Result;
use Illuminate\Support\Collection;

/**
 * Automatic scoring at submit time (spec 6). Objective question types are scored
 * server-side; essays stay pending until a teacher grades them manually.
 *
 * Per-type rules:
 * - multiple_choice / true_false: exact match on the single chosen option
 * - multiple_answers: the selected set must equal the correct set
 * - statement_true_false: partial credit per judged statement
 * - matching: partial credit per matched pair
 * - essay: not auto-scored (earned 0, flagged pending; total score stays null)
 */
class ExamScorer
{
    /**
     * Score the session (if needed) and persist the result with per-question details.
     */
    public function score(ExamSession $session): Result
    {
        if ($session->result()->exists()) {
            return $session->result;
        }

        $session->load(['exam.questions.options', 'exam.questions.pairs', 'answers']);

        $questionsById = $session->exam->questions->keyBy('id');
        $ordered = collect($session->question_order)
            ->map(fn (int $questionId) => $questionsById->get($questionId))
            ->filter();

        $earnedTotal = 0.0;
        $maxTotal = 0.0;
        $correctCount = 0;
        $hasEssayPending = false;

        $details = $ordered->map(function (Question $question) use ($session, &$earnedTotal, &$maxTotal, &$correctCount, &$hasEssayPending) {
            $answer = $session->answers->firstWhere('question_id', $question->id);
            $max = (float) $question->weight;
            $maxTotal += $max;

            [$earned, $isCorrect] = $this->scoreQuestion($question, $answer?->value);
            $earnedTotal += $earned;

            if ($question->type === 'essay') {
                $hasEssayPending = true;
            } elseif ($isCorrect) {
                $correctCount++;
            }

            return [
                'question_id' => $question->id,
                'earned' => round($earned, 2),
                'max' => $max,
                'is_correct' => $question->type === 'essay' ? null : $isCorrect,
                'student_answer' => $answer?->value,
                'correct_answer' => $this->correctAnswer($question),
                'graded_at' => $question->type === 'essay' ? null : ($session->submitted_at ?? now()),
            ];
        });

        $result = Result::query()->create([
            'exam_session_id' => $session->id,
            'score' => $hasEssayPending ? null : ($maxTotal > 0 ? round($earnedTotal / $maxTotal * 100, 2) : 0.0),
            'earned_score' => round($earnedTotal, 2),
            'max_score' => round($maxTotal, 2),
            'correct_count' => $correctCount,
            'question_count' => $ordered->count(),
            'has_essay_pending' => $hasEssayPending,
            'submitted_at' => $session->submitted_at ?? now(),
        ]);

        $details->each(fn (array $detail) => $result->details()->create($detail));

        return $result;
    }

    /**
     * Recompute a result's totals after manual essay grading.
     */
    public function refresh(Result $result): Result
    {
        $result->load(['details.question', 'examSession']);

        $earned = round($result->details->sum('earned'), 2);
        $max = round($result->details->sum('max'), 2);
        $hasEssayPending = $result->details->contains(
            fn ($detail) => $detail->question->type === 'essay' && $detail->graded_at === null,
        );

        $result->update([
            'earned_score' => $earned,
            'max_score' => $max,
            'has_essay_pending' => $hasEssayPending,
            'score' => $hasEssayPending ? null : ($max > 0 ? round($earned / $max * 100, 2) : 0.0),
        ]);

        return $result->fresh();
    }

    /**
     * Score a single question.
     *
     * @param  array<string, mixed>|null  $value
     * @return array{0: float, 1: bool} [earned, isCorrect]
     */
    private function scoreQuestion(Question $question, ?array $value): array
    {
        return match ($question->type) {
            'multiple_choice', 'true_false' => $this->scoreSingleOption($question, $value),
            'multiple_answers' => $this->scoreMultipleOptions($question, $value),
            'statement_true_false' => $this->scoreStatements($question, $value),
            'matching' => $this->scoreMatching($question, $value),
            default => [0.0, false], // essay
        };
    }

    /**
     * @return array{0: float, 1: bool}
     */
    private function scoreSingleOption(Question $question, ?array $value): array
    {
        $correct = $question->options->firstWhere('is_correct', true);
        $isCorrect = $correct !== null && ($value['option_id'] ?? null) === $correct->id;

        return [$isCorrect ? (float) $question->weight : 0.0, $isCorrect];
    }

    /**
     * @return array{0: float, 1: bool}
     */
    private function scoreMultipleOptions(Question $question, ?array $value): array
    {
        $correctIds = $question->options->where('is_correct', true)->pluck('id')->sort()->values();
        $chosenIds = collect($value['option_ids'] ?? [])->map(fn ($id) => (int) $id)->sort()->values();

        $isCorrect = $correctIds->count() > 0 && $correctIds->all() === $chosenIds->all();

        return [$isCorrect ? (float) $question->weight : 0.0, $isCorrect];
    }

    /**
     * @return array{0: float, 1: bool}
     */
    private function scoreStatements(Question $question, ?array $value): array
    {
        $judgments = $value['judgments'] ?? [];
        $max = (float) $question->weight;

        if ($question->options->isEmpty()) {
            return [0.0, false];
        }

        $earned = 0.0;
        $allCorrect = true;

        foreach ($question->options as $option) {
            $expected = (bool) $option->is_correct;
            $given = $judgments[$option->id] ?? $judgments[(string) $option->id] ?? null;

            if ($given === null || filter_var($given, FILTER_VALIDATE_BOOLEAN) !== $expected) {
                $allCorrect = false;
                continue;
            }

            $earned += $max / $question->options->count();
        }

        return [$earned, $allCorrect];
    }

    /**
     * @return array{0: float, 1: bool}
     */
    private function scoreMatching(Question $question, ?array $value): array
    {
        $matches = $value['matches'] ?? [];
        $max = (float) $question->weight;
        $pairs = $question->pairs;

        if ($pairs->isEmpty()) {
            return [0.0, false];
        }

        $earned = 0.0;
        $allCorrect = true;

        foreach ($pairs as $pair) {
            $given = trim((string) ($matches[$pair->id] ?? $matches[(string) $pair->id] ?? ''));

            if ($given === '' || $given !== trim($pair->right_text)) {
                $allCorrect = false;
                continue;
            }

            $earned += $max / $pairs->count();
        }

        return [$earned, $allCorrect];
    }

    /**
     * The answer key snapshot stored on the result detail for later review.
     *
     * @return array<string, mixed>|null
     */
    private function correctAnswer(Question $question): ?array
    {
        return match ($question->type) {
            'multiple_choice', 'true_false' => (($correct = $question->options->firstWhere('is_correct', true)) !== null) ? ['option_id' => $correct->id] : null,
            'multiple_answers' => ['option_ids' => $question->options->where('is_correct', true)->pluck('id')->all()],
            'statement_true_false' => ['judgments' => $question->options->pluck('is_correct', 'id')->all()],
            'matching' => ['matches' => $question->pairs->pluck('right_text', 'id')->all()],
            default => null, // essay
        };
    }
}
