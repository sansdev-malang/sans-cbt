<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Student;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * System-wide score report: per-exam aggregates and school statistics.
     */
    public function index(): Response
    {
        $exams = Exam::query()
            ->with(['teacher:id,full_name', 'subject:id,name', 'schoolClass:id,name'])
            ->withCount(['sessions as submitted_count' => fn ($query) => $query->where('status', '!=', 'ongoing')])
            ->withCount('questions')
            ->orderByDesc('started_at')
            ->get();

        $rows = $exams->map(function (Exam $exam): array {
            $scores = $exam->sessions()
                ->where('status', '!=', 'ongoing')
                ->with('result')
                ->get()
                ->pluck('result.score')
                ->filter(fn ($score) => $score !== null);

            return [
                'id' => $exam->id,
                'name' => $exam->name,
                'teacher' => $exam->teacher?->full_name,
                'subject' => $exam->subject->name,
                'class' => $exam->schoolClass->name,
                'questions_count' => $exam->questions_count,
                'submitted_count' => $exam->submitted_count,
                'average' => $scores->isNotEmpty() ? round($scores->avg(), 2) : null,
                'highest' => $scores->max(),
                'lowest' => $scores->min(),
                'is_published' => $exam->is_published,
            ];
        })->all();

        $allScores = \App\Models\Result::query()->pluck('score')->filter();

        return Inertia::render('admin/reports/index', [
            'stats' => [
                ['label' => 'Total Ujian', 'value' => $exams->count()],
                ['label' => 'Ujian Terpublikasi', 'value' => $exams->where('is_published', true)->count()],
                ['label' => 'Ujian Dikumpulkan', 'value' => ExamSession::query()->where('status', '!=', 'ongoing')->count()],
                ['label' => 'Rata-rata Nasional', 'value' => $allScores->isNotEmpty() ? round($allScores->avg(), 2) : null],
            ],
            'rows' => $rows,
            'recentViolations' => AuditLog::query()->whereIn('level', ['violation', 'critical'])->with('user:id,name')->latest('id')->limit(5)->get()
                ->map(fn (AuditLog $log): array => [
                    'id' => $log->id,
                    'event_type' => $log->event_type,
                    'user_name' => $log->user?->name,
                    'created_at_label' => $log->created_at->translatedFormat('d M H:i'),
                ])->all(),
        ]);
    }
}
