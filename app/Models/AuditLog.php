<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Audit trail for the CBT system (spec 17): lifecycle events and security events
 * with an INFO / WARNING / VIOLATION / CRITICAL level.
 */
#[Fillable(['user_id', 'exam_id', 'exam_session_id', 'event_type', 'level', 'metadata', 'ip_address', 'user_agent'])]
class AuditLog extends Model
{
    public const LEVELS = ['info', 'warning', 'violation', 'critical'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }
}
