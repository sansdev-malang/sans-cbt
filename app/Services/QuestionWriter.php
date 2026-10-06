<?php

namespace App\Services;

use App\Http\Requests\Admin\QuestionRequest;
use App\Models\Question;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Persists questions together with their options, matching pairs, and attached images.
 * Shared by the admin and teacher question controllers.
 */
class QuestionWriter
{
    public function create(QuestionRequest $request): Question
    {
        [$imagePath] = $this->resolveImagePath($request);

        return DB::transaction(function () use ($request, $imagePath): Question {
            $question = Question::query()->create([...$request->safe()->only(['question_bank_id', 'content', 'type', 'difficulty', 'weight', 'stimulus']), 'image_path' => $imagePath]);

            $question->options()->createMany($this->optionRows($request));
            $this->syncPairs($question, $request);

            return $question;
        });
    }
    public function update(Question $question, QuestionRequest $request): void
    {
        $stalePaths = [];

        DB::transaction(function () use ($request, $question, &$stalePaths): void {
            [$imagePath, $stale] = $this->resolveImagePath($request, $question->image_path);
            if ($stale !== null) {
                $stalePaths[] = $stale;
            }

            $oldOptionImages = $question->options()->pluck('image_path')->filter()->all();
            $rows = $this->optionRows($request, $stalePaths);

            $question->update([...$request->safe()->only(['content', 'type', 'difficulty', 'weight', 'stimulus']), 'image_path' => $imagePath]);
            $question->options()->delete();
            $question->options()->createMany($rows);
            $this->syncPairs($question, $request, $stalePaths);

            $kept = collect($rows)->pluck('image_path')->filter()->all();
            foreach ($oldOptionImages as $oldImage) {
                if (! in_array($oldImage, $kept)) {
                    $stalePaths[] = $oldImage;
                }
            }
        });

        collect($stalePaths)->unique()->each(fn (string $path) => Storage::disk('local')->delete($path));
    }

    public function delete(Question $question): void
    {
        $imagePaths = $question->options()->pluck('image_path')
            ->merge($question->pairs()->pluck('left_image_path'))
            ->merge($question->pairs()->pluck('right_image_path'))
            ->push($question->image_path)
            ->filter()
            ->unique()
            ->all();

        $question->delete();

        foreach ($imagePaths as $path) {
            Storage::disk('local')->delete($path);
        }
    }

    /**
     * Compute the final question image path, replacing or dropping the stored file as requested.
     *
     * @return array{0: ?string, 1: ?string} [newPath, stalePath]
     */
    private function resolveImagePath(QuestionRequest $request, ?string $current = null): array
    {
        if ($file = $request->file('image')) {
            return [$this->storeImage($file), $current];
        }

        if ($request->boolean('remove_image')) {
            return [null, $current];
        }

        return [$current, null];
    }

    private function storeImage(UploadedFile $file): string
    {
        return $file->store('question-media', 'local');
    }

    /**
     * Build the option rows for the request. The request has already normalized every
     * question type into options[] carrying is_correct flags; here we only handle the
     * option image uploads/removals and collect replaced files.
     *
     * @param  list<string>  $stalePaths
     * @return list<array{label: string, content: string, is_correct: bool, image_path: ?string}>
     */
    private function optionRows(QuestionRequest $request, array &$stalePaths = []): array
    {
        // Statement files are uploaded under statements[i][image]; after normalization
        // they map 1:1 onto options by index.
        $filePrefix = $request->input('type') === 'statement_true_false' ? 'statements' : 'options';

        return collect($request->input('options', []))
            ->values()
            ->map(function (array $option, int $index) use ($request, $filePrefix, &$stalePaths): array {
                $path = isset($option['image_path']) ? (string) $option['image_path'] : null;

                if ($file = $request->file("$filePrefix.$index.image")) {
                    if ($path !== null) {
                        $stalePaths[] = $path;
                    }
                    $path = $this->storeImage($file);
                } elseif (! empty($option['remove_image'])) {
                    if ($path !== null) {
                        $stalePaths[] = $path;
                    }
                    $path = null;
                }

                return [
                    'label' => chr(65 + $index),
                    'content' => (string) $option['content'],
                    'is_correct' => filter_var($option['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'image_path' => $path,
                ];
            })
            ->all();
    }

    /**
     * Rebuild the left-right pairs for matching questions, handling left/right image
     * uploads and removals; clears stale pairs when the question switched to another type.
     */
    private function syncPairs(Question $question, QuestionRequest $request, array &$stalePaths = []): void
    {
        $rows = collect($request->input('pairs', []))
            ->values()
            ->map(function (array $pair, int $index) use ($request, &$stalePaths): array {
                return [
                    'left_text' => (string) $pair['left_text'],
                    'right_text' => (string) $pair['right_text'],
                    'left_image_path' => $this->pairImagePath($request, $pair, $index, 'left', $stalePaths),
                    'right_image_path' => $this->pairImagePath($request, $pair, $index, 'right', $stalePaths),
                    'sort_order' => $index + 1,
                ];
            })
            ->all();

        $question->pairs()->delete();

        if ($rows !== []) {
            $question->pairs()->createMany($rows);
        }
    }

    /**
     * Resolve one side's image path (upload/keep/remove) and collect replaced files.
     *
     * @param  array<string, mixed>  $pair
     * @param  list<string>  $stalePaths
     */
    private function pairImagePath(QuestionRequest $request, array $pair, int $index, string $side, array &$stalePaths): ?string
    {
        $path = isset($pair["{$side}_image_path"]) ? (string) $pair["{$side}_image_path"] : null;

        if ($file = $request->file("pairs.$index.{$side}_image")) {
            if ($path !== null) {
                $stalePaths[] = $path;
            }

            return $this->storeImage($file);
        }

        if (! empty($pair["{$side}_remove_image"])) {
            if ($path !== null) {
                $stalePaths[] = $path;
            }

            return null;
        }

        return $path;
    }
}
