<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ExamSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
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

        return Inertia::render('admin/audit-logs/index', [
            'logs' => $logs,
            'levels' => AuditLog::LEVELS,
            'eventTypes' => AuditLog::query()->distinct()->orderBy('event_type')->pluck('event_type')->all(),
            'filters' => ['level' => $level, 'event' => $eventType],
        ]);
    }
}
