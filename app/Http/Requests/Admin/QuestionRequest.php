<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionRequest extends FormRequest
{
    /**
     * Question types that store their answers in the options table.
     */
    public const TYPES = ['multiple_choice', 'multiple_answers', 'true_false', 'statement_true_false', 'matching', 'essay'];

    /**
     * Normalize every type into one canonical option shape before validation so the
     * controller and QuestionWriter only deal with options[] carrying is_correct flags.
     *
     * - multiple_choice / multiple_answers: incoming options get is_correct from the key index(es)
     * - true_false: forced to the Benar/Salah pair
     * - statement_true_false: each statement becomes an option (is_correct = statement is Benar)
     * - matching: pairs[] are stored separately, options stay empty
     * - essay: no options
     */
    protected function prepareForValidation(): void
    {
        $type = (string) $this->input('type', 'multiple_choice');

        $options = match ($type) {
            'multiple_choice' => $this->normalizeIndexedCorrect((array) $this->input('options', []), [(int) $this->input('correct_option', -1)]),
            'multiple_answers' => $this->normalizeIndexedCorrect((array) $this->input('options', []), array_map(intval(...), (array) $this->input('correct_options', []))),
            'true_false' => $this->normalizeIndexedCorrect([['content' => 'Benar'], ['content' => 'Salah']], [(int) $this->input('correct_option', 0)]),
            'statement_true_false' => collect((array) $this->input('statements', []))
                ->map(fn (array $statement): array => [
                    'content' => (string) ($statement['content'] ?? ''),
                    'is_correct' => isset($statement['is_true']) && filter_var($statement['is_true'], FILTER_VALIDATE_BOOLEAN),
                    'image_path' => $statement['image_path'] ?? null,
                    'remove_image' => $statement['remove_image'] ?? null,
                ])
                ->all(),
            default => [],
        };

        $this->merge([
            'options' => $options,
            'correct_option' => in_array($type, ['multiple_choice', 'true_false'], true) ? (int) $this->input('correct_option', 0) : null,
        ]);
    }

    /**
     * Attach is_correct flags to raw option rows based on the chosen key indices,
     * keeping the image bookkeeping fields intact for QuestionWriter.
     *
     * @param  array<int, mixed>  $options
     * @param  list<int>  $correctIndices
     * @return list<array<string, mixed>>
     */
    private function normalizeIndexedCorrect(array $options, array $correctIndices): array
    {
        return collect($options)
            ->values()
            ->map(function (mixed $option, int $index) use ($correctIndices): array {
                $row = is_array($option) ? $option : ['content' => (string) $option];

                return [
                    'content' => (string) ($row['content'] ?? ''),
                    'is_correct' => in_array($index, $correctIndices, true),
                    'image_path' => $row['image_path'] ?? null,
                    'remove_image' => $row['remove_image'] ?? null,
                ];
            })
            ->all();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $type = (string) $this->input('type', 'multiple_choice');

        $optionRules = match ($type) {
            'multiple_choice', 'multiple_answers' => ['min:4', 'max:5'],
            'true_false' => ['size:2'],
            'statement_true_false' => ['min:2', 'max:10'],
            default => ['max:0'],
        };

        return [
            'question_bank_id' => [$this->isMethod('post') ? 'required' : 'nullable', 'integer', Rule::exists('question_banks', 'id')],
            'type' => ['required', Rule::in(self::TYPES)],
            'content' => ['required', 'string', 'max:10000'],
            'stimulus' => ['nullable', 'string', 'max:10000'],
            'difficulty' => ['nullable', Rule::in(['Mudah', 'Sedang', 'Sulit'])],
            'weight' => ['required', 'integer', 'min:1', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'image_path' => ['nullable', 'string', 'regex:#^question-media/[A-Za-z0-9._-]+$#'],
            'remove_image' => ['nullable', 'boolean'],
            'options' => [Rule::requiredIf(in_array($type, ['multiple_choice', 'multiple_answers', 'true_false', 'statement_true_false'], true)), 'nullable', 'array', ...$optionRules],
            'options.*.content' => ['required_with:options', 'string', 'max:5000'],
            'options.*.image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'options.*.image_path' => ['nullable', 'string', 'regex:#^question-media/[A-Za-z0-9._-]+$#'],
            'options.*.remove_image' => ['nullable', 'boolean'],
            'correct_option' => [Rule::requiredIf(in_array($type, ['multiple_choice', 'true_false'], true)), 'nullable', 'integer', 'min:0', 'max:4'],
            'correct_options' => [Rule::requiredIf($type === 'multiple_answers'), 'nullable', 'array', 'min:1', 'max:5'],
            'correct_options.*' => ['integer', 'min:0', 'max:4'],
            'pairs' => [Rule::requiredIf($type === 'matching'), 'nullable', 'array', 'min:2', 'max:8'],
            'pairs.*.left_text' => ['required_with:pairs', 'string', 'max:500'],
            'pairs.*.right_text' => ['required_with:pairs', 'string', 'max:500'],
            'pairs.*.left_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'pairs.*.left_image_path' => ['nullable', 'string', 'regex:#^question-media/[A-Za-z0-9._-]+$#'],
            'pairs.*.left_remove_image' => ['nullable', 'boolean'],
            'pairs.*.right_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'pairs.*.right_image_path' => ['nullable', 'string', 'regex:#^question-media/[A-Za-z0-9._-]+$#'],
            'pairs.*.right_remove_image' => ['nullable', 'boolean'],
        ];
    }
}
