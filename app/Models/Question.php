<?php

namespace App\Models;

use Database\Factories\QuestionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['question_bank_id', 'content', 'type', 'difficulty', 'weight', 'image_path', 'stimulus'])]
class Question extends Model
{
    /** @use HasFactory<QuestionFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $appends = ['image_url'];

    public function questionBank(): BelongsTo
    {
        return $this->belongsTo(QuestionBank::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class);
    }

    /**
     * Left-right pairs for the matching question type (drag & drop on the student client).
     *
     * @return HasMany<QuestionPair, $this>
     */
    public function pairs(): HasMany
    {
        return $this->hasMany(QuestionPair::class)->orderBy('sort_order');
    }

    /**
     * Authenticated URL for the attached image; media lives outside the public disk.
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->image_path
                ? route('admin.question-media.show', ['path' => basename($this->image_path)])
                : null,
        );
    }
}
