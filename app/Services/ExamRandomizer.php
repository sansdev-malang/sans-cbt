<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;

/**
 * Deterministic randomization for exam sessions. A per-session seed produces the
 * same question and option order for the whole attempt (spec 5.3), so refreshing
 * or resuming never reshuffles an exam mid-way.
 */
class ExamRandomizer
{
    /**
     * Shuffled question id list for a session, honoring the exam's shuffle settings.
     *
     * @return list<int>
     */
    public function questionOrder(Exam $exam, int $seed): array
    {
        $ids = $exam->questions()->orderBy('exam_questions.sort_order')->pluck('questions.id')->all();

        return $exam->shuffle_questions ? $this->shuffle($ids, $seed) : array_values($ids);
    }
    /**
     * Shuffled option id list for one question, honoring the exam's shuffle settings.
     *
     * @param  \Illuminate\Support\Collection<int, QuestionOption>  $options
     * @return list<int>
     */
    public function optionOrder(Exam $exam, Question $question, int $seed, $options): array
    {
        $ids = $options->pluck('id')->all();

        if (! $exam->shuffle_options || $ids === []) {
            return array_values($ids);
        }

        return $this->shuffle($ids, $seed + $question->id);
    }

    /**
     * Shuffled display order for the right-side pool of matching questions.
     *
     * @param  list<array{text: string, image_url: ?string}>  $pool
     * @return list<array{text: string, image_url: ?string}>
     */
    public function shufflePool(array $pool, int $seed): array
    {
        return count($pool) > 1 ? $this->shuffle($pool, $seed) : array_values($pool);
    }

    /**
     * Fisher-Yates driven by the session seed so the order is reproducible.
     *
     * @param  list<mixed>  $items
     * @return list<mixed>
     */
    private function shuffle(array $items, int $seed): array
    {
        mt_srand($seed);

        for ($i = count($items) - 1; $i > 0; $i--) {
            $j = mt_rand(0, $i);
            [$items[$i], $items[$j]] = [$items[$j], $items[$i]];
        }

        return array_values($items);
    }
}
