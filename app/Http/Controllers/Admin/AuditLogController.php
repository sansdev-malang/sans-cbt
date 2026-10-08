<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ExamSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /** Retensi minimum dalam hari — log sesi ujian aktif tidak boleh dihapus. */
    private const MIN_RETENTION_DAYS = 7;

    /**
     * The system-wide audit trail (spec 17) with level and event filters.
     */
    public function index(Request $request): Response
    {
        $level = (string) $request->input('level', '');
        $eventType = (string) $request->input('event', '');

        $logs = AuditLog::query()
            ->with(['user:id,name', 'exam:id,name'])
            ->when($level !== '' && in_array($level, AuditLog::LEVELS, true), fn ($query) => $query->where('level', $level))
            ->when($eventType !== '', fn ($query) => $query->where('event_type', $eventType))
            ->latest('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (AuditLog $log): array => [
                'id' => $log->id,
                'event_type' => $log->event_type,
                'level' => $log->level,
                'user_name' => $log->user?->name,
                'exam_name' => $log->exam?->name,
                'exam_session_id' => $log->exam_session_id,
                'metadata' => $log->metadata,
                'ip_address' => $log->ip_address,
                'created_at_label' => $log->created_at->translatedFormat('d M Y H:i:s'),
            ]);

        $totalCount = AuditLog::count();

        return Inertia::render('admin/audit-logs/index', [
            'logs' => $logs,
            'levels' => AuditLog::LEVELS,
            'eventTypes' => AuditLog::query()->distinct()->orderBy('event_type')->pluck('event_type')->all(),
            'filters' => ['level' => $level, 'event' => $eventType],
            'total_count' => $totalCount,
            'retention_options' => [
                ['days' => 30,  'label' => 'Log lebih dari 30 hari'],
                ['days' => 90,  'label' => 'Log lebih dari 90 hari'],
                ['days' => 180, 'label' => 'Log lebih dari 180 hari'],
                ['days' => 0,   'label' => 'Semua log (kecuali sesi ujian aktif)'],
            ],
        ]);
    }

    /**
     * Purge old audit logs by retention period.
     *
     * Log yang terkait sesi ujian masih berlangsung (status=ongoing) tidak dihapus.
     */
    public function purge(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'days' => ['required', 'integer', 'min:0'],
        ]);

        $days = (int) $validated['days'];

        // Lindungi log milik sesi ujian yang masih berlangsung.
        $activeSessionIds = ExamSession::query()
            ->where('status', 'ongoing')
            ->pluck('id');

        $query = AuditLog::query()
            ->whereNotIn('exam_session_id', $activeSessionIds->all());

        if ($days > 0) {
            $query->where('created_at', '<', now()->subDays($days));
        }

        $deleted = $query->delete();

        Inertia::flash('toast', [
            'type'    => 'success',
            'message' => "Berhasil menghapus {$deleted} entri audit log.",
        ]);

        return redirect()->route('admin.audit-logs.index');
    }
}

