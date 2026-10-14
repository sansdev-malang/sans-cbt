<?php

namespace App\Services;

use App\Models\Question;
use Illuminate\Validation\ValidationException;

/** Validate the small, question-specific answer payload sent by a student. */
class ExamAnswerValidator
{
    /** @param array<string, mixed>|null $value */
    public function validate(Question $question, ?array $value): void
    {
        if ($value === null || $value === []) {
            return;
        }

        switch ($question->type) {
            case 'multiple_choice':
            case 'true_false':
                $this->validateSingleOption($question, $value);
                break;
            case 'multiple_answers':
                $this->validateMultipleOptions($question, $value);
                break;
            case 'statement_true_false':
                $this->validateJudgments($question, $value);
                break;
            case 'matching':
                $this->validateMatches($question, $value);
                break;
            case 'essay':
                $this->validateEssay($value);
                break;
            default:
                $this->invalid();
        }
    }

    /** @param array<string, mixed> $value */
    private function validateSingleOption(Question $question, array $value): void
    {
        $this->requireShape($value, 'option_id');
        $id = filter_var($value['option_id'], FILTER_VALIDATE_INT);
        if ($id !== false && ! $question->options->contains('id', $id)) {
            $this->invalid();
        }
        if ($value['option_id'] !== null && $id === false) {
            $this->invalid();
        }
    }

    /** @param array<string, mixed> $value */
    private function validateMultipleOptions(Question $question, array $value): void
    {
        $this->requireShape($value, 'option_ids');
        $ids = $value['option_ids'];
        if (! is_array($ids) || count($ids) > $question->options->count()) {
            $this->invalid();
        }

        foreach ($ids as $id) {
            $id = filter_var($id, FILTER_VALIDATE_INT);
            if ($id === false || ! $question->options->contains('id', $id)) {
                $this->invalid();
            }
        }
    }

    /** @param array<string, mixed> $value */
    private function validateJudgments(Question $question, array $value): void
    {
        $this->requireShape($value, 'judgments');
        $judgments = $value['judgments'];
        if (! is_array($judgments) || count($judgments) > $question->options->count()) {
            $this->invalid();
        }

        $optionIds = $question->options->modelKeys();
        foreach ($judgments as $id => $judgment) {
            $id = filter_var((string) $id, FILTER_VALIDATE_INT);
            if ($id === false || ! in_array($id, $optionIds, true) || ! is_bool($judgment)) {
                $this->invalid();
            }
        }
    }

    /** @param array<string, mixed> $value */
    private function validateMatches(Question $question, array $value): void
    {
        $this->requireShape($value, 'matches');
        $matches = $value['matches'];
        if (! is_array($matches) || count($matches) > $question->pairs->count()) {
            $this->invalid();
        }

        $pairIds = $question->pairs->modelKeys();
        $rightTexts = $question->pairs->pluck('right_text')->all();
        foreach ($matches as $id => $text) {
            $id = filter_var((string) $id, FILTER_VALIDATE_INT);
            if ($id === false || ! in_array($id, $pairIds, true) || ! is_string($text) || ! in_array($text, $rightTexts, true)) {
                $this->invalid();
            }
        }
    }

    /** @param array<string, mixed> $value */
    private function validateEssay(array $value): void
    {
        $this->requireShape($value, 'text');
        if (! is_string($value['text']) || mb_strlen($value['text']) > 10000) {
            $this->invalid();
        }
    }

    /** @param array<string, mixed> $value */
    private function requireShape(array $value, string $key): void
    {
        if (array_keys($value) !== [$key] || ! array_key_exists($key, $value)) {
            $this->invalid();
        }
    }

    private function invalid(): never
    {
        throw ValidationException::withMessages([
            'value' => 'Format jawaban tidak sesuai dengan tipe soal atau pilihan yang tersedia.',
        ]);
    }
}
