<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['question_id', 'left_text', 'right_text', 'left_image_path', 'right_image_path', 'sort_order'])]
class QuestionPair extends Model
{
    /** @var list<string> */
    protected $appends = ['left_image_url', 'right_image_url'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    protected function leftImageUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->left_image_path
                ? route('admin.question-media.show', ['path' => basename($this->left_image_path)])
                : null,
        );
    }

    protected function rightImageUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->right_image_path
                ? route('admin.question-media.show', ['path' => basename($this->right_image_path)])
                : null,
        );
    }
}
