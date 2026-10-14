<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ExamSession;
use App\Services\ExamAuditLogger;
use Inertia\Inertia;
use Inertia\Response;

class ExamMonitorController extends Controller
{
    /**
     * System-wide live view of running exam sessions and recent security events.
     */
    public function __invoke(): Response
    {
        $ongoing = ExamSession::query()
            ->where('status', 'ongoing')
            ->whereHas('student')
            ->whereHas('exam')
            ->with(['exam:id,name,subject_id,duration_minutes', 'exam.subject:id,name', 'student:id,full_name', 'answers'])
            ->orderBy('started_at')
            ->get()
            ->map(function (ExamSession $session): array {
                $securityNotesCount = $session->auditLogs()
                    ->whereIn('level', ['warning', 'violation', 'critical'])
                    ->where('event_type', '!=', 'SESSION_LOCKED')
                    ->count();

                return [
                    'id' => $session->id,
                    'exam_name' => $session->exam?->name ?? '(ujian terhapus)',
                    'subject' => $session->exam?->subject?->name ?? '—',
                    'student_name' => $session->student?->full_name ?? '(siswa terhapus)',
                    'answered_count' => $session->answers->count(),
                    'started_at_label' => $session->started_at->translatedFormat('d M Y H:i'),
                    'remaining_minutes' => max(0, (int) ceil(now()->diffInMinutes($session->deadline(), false))),
                    'locked' => $session->isLocked(),
                    'security_notes_count' => $securityNotesCount,
                    'flagged' => $securityNotesCount >= ExamAuditLogger::REVIEW_EVENT_THRESHOLD,
                ];
            })
            ->all();

        $recentViolations = AuditLog::query()
            ->whereIn('level', ['warning', 'violation', 'critical'])
            ->with(['user:id,name', 'exam:id,name'])
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(fn (AuditLog $log): array => [
                'id' => $log->id,
                'event_type' => $log->event_type,
                'level' => $log->level,
                'user_name' => $log->user?->name,
                'exam_name' => $log->exam?->name,
                'created_at_label' => $log->created_at->translatedFormat('d M Y H:i:s'),
            ])
            ->all();

        return Inertia::render('admin/exam-monitoring/index', [
            'ongoing' => $ongoing,
            'recentViolations' => $recentViolations,
            'stats' => [
                ['label' => 'Sesi Berjalan', 'value' => count($ongoing)],
                ['label' => 'Catatan Keamanan Hari Ini', 'value' => AuditLog::query()->whereIn('level', ['warning', 'violation', 'critical'])->where('created_at', '>=', today())->count()],
                ['label' => 'Peringatan Hari Ini', 'value' => AuditLog::query()->where('level', 'warning')->where('created_at', '>=', today())->count()],
            ],
        ]);
    }
}
