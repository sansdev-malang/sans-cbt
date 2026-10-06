<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One saved answer inside an exam session. The `value` JSON shape depends on the
 * question type:
 * - multiple_choice / true_false: {"option_id": int}
 * - multiple_answers: {"option_ids": list<int>}
 * - statement_true_false: {"judgments": {option_id: bool}}
 * - matching: {"matches": {pair_id: string}}
 * - essay: {"text": string}
 */
#[Fillable(['exam_session_id', 'question_id', 'value'])]
class Answer extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
