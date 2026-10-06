<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['exam_session_id', 'score', 'earned_score', 'max_score', 'correct_count', 'question_count', 'has_essay_pending', 'submitted_at'])]
class Result extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'score' => 'float',
            'earned_score' => 'float',
            'max_score' => 'float',
            'correct_count' => 'integer',
            'question_count' => 'integer',
            'has_essay_pending' => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    /**
     * @return HasMany<ResultDetail, $this>
     */
    public function details(): HasMany
    {
        return $this->hasMany(ResultDetail::class);
    }
}
