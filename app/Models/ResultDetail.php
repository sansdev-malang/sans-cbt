<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['result_id', 'question_id', 'earned', 'max', 'is_correct', 'student_answer', 'correct_answer', 'graded_at'])]
class ResultDetail extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'earned' => 'float',
            'max' => 'float',
            'is_correct' => 'boolean',
            'student_answer' => 'array',
            'correct_answer' => 'array',
            'graded_at' => 'datetime',
        ];
    }

    public function result(): BelongsTo
    {
        return $this->belongsTo(Result::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
