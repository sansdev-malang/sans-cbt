<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\ExamRequest;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\ExamAuditLogger;
use App\Services\ExamScorer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Exam management for teachers: pick questions from their own banks,
 * schedule the exam for a class, then publish it.
 */
class ExamController extends Controller
{
    public function __construct(private readonly ExamScorer $scorer, private readonly ExamAuditLogger $audit) {}

    /**
     * Display a listing of the teacher's exams.
     */
    public function index(Request $request): Response
    {
        $teacher = $this->profile($request);

        $exams = Exam::query()
            ->where('teacher_id', $teacher->id)
            ->with(['subject:id,name', 'schoolClass:id,name'])
            ->withCount('questions')
            ->orderByDesc('started_at')
            ->get()
            ->map(fn (Exam $exam): array => $this->examPayload($exam))
            ->all();

        return Inertia::render('teacher/exams/index', [
            'exams' => $exams,
            ...$this->formOptions($request),
        ]);
    }

    /**
     * Store a newly created exam.
     */
    public function store(ExamRequest $request): RedirectResponse
    {
        $teacher = $this->profile($request);
        $questionIds = $this->ownedQuestionIds($request, $teacher);

        $exam = DB::transaction(function () use ($request, $teacher, $questionIds): Exam {
            $exam = Exam::query()->create([...$request->safe()->except(['question_ids']), 'teacher_id' => $teacher->id]);
            $exam->questions()->sync($this->pivotMap($questionIds));

            return $exam;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ujian berhasil dibuat.']);

        return redirect()->route('teacher.exams.show', $exam);
    }

    /**
     * Display the exam detail.
     */
    public function show(Request $request, Exam $exam): Response
    {
        $this->authorizeExam($request, $exam);

        $exam->load(['subject:id,name', 'schoolClass:id,name']);
        $participantCount = $exam->schoolClass->students()->count();

        return Inertia::render('teacher/exams/show', [
            'exam' => [...$this->examPayload($exam), 'description' => $exam->description, 'participants_count' => $participantCount,
                'has_essay' => $exam->questions()->where('type', 'essay')->exists(),
                'has_pending_essays' => $exam->realSessions()
                    ->where('status', '!=', 'ongoing')
                    ->whereHas('result.details', fn ($query) => $query->whereNull('graded_at')->whereHas('question', fn ($q) => $q->where('type', 'essay')))
                    ->exists(),
                'questions' => $exam->questions->map(fn (Question $question): array => [
                    'id' => $question->id,
                    'content' => $question->content,
                    'type' => $question->type,
                    'difficulty' => $question->difficulty,
                    'weight' => $question->weight,
                    'image_url' => $question->image_url,
                ])->all(),
            ],
        ]);
    }

    /**
     * Show the form for editing the exam.
     */
    public function edit(Request $request, Exam $exam): Response
    {
        $this->authorizeExam($request, $exam);

        return Inertia::render('teacher/exams/edit', [
            ...$this->formOptions($request),
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'description' => $exam->description,
                'subject_id' => $exam->subject_id,
                'school_class_id' => $exam->school_class_id,
                'started_at' => $exam->started_at->format('Y-m-d\TH:i'),
                'duration_minutes' => $exam->duration_minutes,
                'shuffle_questions' => $exam->shuffle_questions,
                'shuffle_options' => $exam->shuffle_options,
                'show_result_immediately' => $exam->show_result_immediately,
                'question_ids' => $exam->questions->pluck('id')->all(),
            ],
        ]);
    }

    /**
     * Update the exam.
     */
    public function update(ExamRequest $request, Exam $exam): RedirectResponse
    {
        $this->authorizeExam($request, $exam);
        $teacher = $this->profile($request);
        $questionIds = $this->ownedQuestionIds($request, $teacher);

        DB::transaction(function () use ($request, $exam, $questionIds): void {
            $exam->update($request->safe()->except(['question_ids']));
            $exam->questions()->sync($this->pivotMap($questionIds));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ujian berhasil diperbarui.']);

        return redirect()->route('teacher.exams.show', $exam);
    }

    /**
     * Remove the exam.
     */
    public function destroy(Request $request, Exam $exam): RedirectResponse
    {
        $this->authorizeExam($request, $exam);
        $exam->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ujian berhasil dihapus.']);

        return redirect()->route('teacher.exams.index');
    }

    /**
     * Publish the exam so registered participants can see it.
     */
    public function publish(Request $request, Exam $exam): RedirectResponse
    {
        $this->authorizeExam($request, $exam);

        if ($exam->questions()->count() === 0) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Tambahkan minimal satu soal sebelum mempublikasikan ujian.']);

            return back();
        }

        $exam->update(['is_published' => true, 'published_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ujian berhasil dipublikasikan.']);

        return back();
    }

    /**
     * Revert the exam back to draft.
     */
    public function unpublish(Request $request, Exam $exam): RedirectResponse
    {
        $this->authorizeExam($request, $exam);
        $exam->update(['is_published' => false, 'published_at' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ujian dikembalikan ke draft.']);

        return back();
    }

    /**
     * Score report for one exam: statistics, per-question item analysis, and
     * one row per submitted session.
     */
    public function results(Request $request, Exam $exam): Response
    {
        $this->authorizeExam($request, $exam);

        $exam->load(['subject:id,name', 'schoolClass:id,name']);
        $sessions = $exam->realSessions()
            ->where('status', '!=', 'ongoing')
            ->with(['student:id,full_name', 'result'])
            ->orderBy('submitted_at')
            ->get();

        $scores = $sessions->map(fn (ExamSession $session) => $session->result?->score)->filter(fn ($score) => $score !== null);

        $rows = $sessions->map(fn (ExamSession $session): array => [
            'id' => $session->id,
            'student_name' => $session->student->full_name,
            'status' => $session->status,
            'score' => $session->result?->score,
            'earned_score' => (float) ($session->result?->earned_score ?? 0),
            'max_score' => (float) ($session->result?->max_score ?? 0),
            'correct_count' => $session->result?->correct_count ?? 0,
            'question_count' => $session->result?->question_count ?? 0,
            'has_essay_pending' => $session->result?->has_essay_pending ?? false,
            'submitted_at_label' => ($session->submitted_at ?? $session->started_at)->translatedFormat('d M Y H:i'),
            'violations_count' => $session->auditLogs()->whereIn('level', ['violation', 'critical'])->where('event_type', '!=', 'SESSION_LOCKED')->count(),
        ])->all();

        return Inertia::render('teacher/exams/results', [
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'subject' => $exam->subject->name,
                'class' => $exam->schoolClass->name,
                'questions_count' => $exam->questions()->count(),
                'participants_count' => $exam->schoolClass->students()->count(),
            ],
            'stats' => [
                'submitted' => $sessions->count(),
                'scored' => $scores->count(),
                'average' => $scores->isNotEmpty() ? round($scores->avg(), 2) : null,
                'highest' => $scores->max(),
                'lowest' => $scores->min(),
                'essay_pending' => $sessions->where('result.has_essay_pending', true)->count(),
            ],
            'rows' => $rows,
            'questionStats' => $this->questionStats($exam, $sessions),
        ]);
    }

    /**
     * Item analysis: how the class performed on each question.
     *
     * @param  \Illuminate\Support\Collection<int, ExamSession>  $sessions
     * @return list<array<string, mixed>>
     */
    private function questionStats(Exam $exam, $sessions): array
    {
        $details = \App\Models\ResultDetail::query()
            ->whereIn('result_id', $sessions->pluck('result.id')->filter())
            ->with('question:id,content,type,weight')
            ->get()
            ->groupBy('question_id');

        return collect($exam->questions->pluck('id'))
            ->map(function (int $questionId, int $index) use ($details): ?array {
                $group = $details->get($questionId);

                if ($group === null || $group->isEmpty()) {
                    return null;
                }

                $maxTotal = (float) $group->sum('max');
                $earnedTotal = (float) $group->sum('earned');
                $correct = $group->where('is_correct', true)->count();

                return [
                    'number' => $index + 1,
                    'id' => $questionId,
                    'content' => $group->first()->question->content,
                    'type' => $group->first()->question->type,
                    'weight' => (float) $group->first()->question->weight,
                    'avg_earned' => round($earnedTotal / $group->count(), 2),
                    'max' => (float) $group->first()->max,
                    'correct_percent' => $maxTotal > 0 ? round($earnedTotal / $maxTotal * 100) : 0,
                    'correct_count' => $correct,
                    'answered_count' => $group->count(),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * CSV export of the score report.
     */
    public function exportResults(Request $request, Exam $exam): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorizeExam($request, $exam);

        $sessions = $exam->realSessions()
            ->where('status', '!=', 'ongoing')
            ->with(['student:id,full_name', 'result'])
            ->orderBy('submitted_at')
            ->get();

        $filename = 'nilai-'.\Illuminate\Support\Str::slug($exam->name).'-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($exam, $sessions): void {
            $out = fopen('php://output', 'w');
            fputs($out, "\xEF\xBB\xBF"); // UTF-8 BOM agar Excel membaca dengan benar
            fputcsv($out, ['No', 'Nama Siswa', 'Status', 'Skor', 'Nilai (0-100)', 'Benar', 'Total Soal', 'Menunggu Esai', 'Waktu Kumpul']);

            foreach ($sessions->values() as $index => $session) {
                fputcsv($out, [
                    $index + 1,
                    $session->student->full_name,
                    $session->status,
                    $session->result?->earned_score.' / '.$session->result?->max_score,
                    $session->result?->score ?? ($session->result?->has_essay_pending ? 'Menunggu esai' : '-'),
                    $session->result?->correct_count,
                    $session->result?->question_count,
                    $session->result?->has_essay_pending ? 'Ya' : 'Tidak',
                    ($session->submitted_at ?? $session->started_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Essay grading page: every submitted session with its pending essay answers.
     */
    public function grading(Request $request, Exam $exam): Response
    {
        $this->authorizeExam($request, $exam);

        $sessions = $exam->realSessions()
            ->with(['student:id,full_name', 'result.details.question:id,content,type,weight'])
            ->orderBy('started_at')
            ->get()
            ->map(fn (ExamSession $session): array => $this->gradingPayload($session))
            ->all();

        return Inertia::render('teacher/exams/grading', [
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'subject' => $exam->subject->name,
                'class' => $exam->schoolClass->name,
            ],
            'sessions' => $sessions,
        ]);
    }

    /**
     * Store manual essay scores for one session and refresh the result totals.
     */
    public function grade(Request $request, Exam $exam, ExamSession $session): RedirectResponse
    {
        $this->authorizeExam($request, $exam);
        abort_unless($session->exam_id === $exam->id, 404);

        $result = $session->result;
        if ($result === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Sesi ini belum dikumpulkan.']);

            return back();
        }

        $validated = $request->validate([
            'scores' => ['required', 'array', 'min:1'],
            'scores.*' => ['numeric', 'min:0'],
        ]);

        $essayIds = $exam->questions()->where('type', 'essay')->pluck('questions.id');

        foreach ($validated['scores'] as $questionId => $score) {
            $detail = $result->details()->where('question_id', $questionId)->first();
            $question = $detail?->question;

            if ($question === null || $question->type !== 'essay' || ! $essayIds->contains((int) $questionId)) {
                continue;
            }

            $detail->update([
                'earned' => min((float) $score, (float) $question->weight),
                'graded_at' => now(),
            ]);
        }

        $this->scorer->refresh($result->fresh());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nilai esai berhasil disimpan.']);

        return back();
    }

    /**
     * Live participant monitoring for one exam.
     */
    public function monitor(Request $request, Exam $exam): Response
    {
        $this->authorizeExam($request, $exam);

        $exam->load(['subject:id,name', 'schoolClass:id,name']);
        $questionsCount = $exam->questions()->count();

        $sessions = $exam->realSessions()
            ->with(['student:id,full_name', 'answers'])
            ->withCount(['auditLogs as violations_count' => fn ($query) => $query->whereIn('level', ['violation', 'critical'])->where('event_type', '!=', 'SESSION_LOCKED')])
            ->withCount(['auditLogs as warnings_count' => fn ($query) => $query->where('level', 'warning')])
            ->orderBy('started_at')
            ->get()
            ->map(function (ExamSession $session) use ($questionsCount): array {
                $lastActivity = $session->answers->max('updated_at');
                $lastViolation = $session->auditLogs()->whereIn('level', ['violation', 'warning'])->orderByDesc('id')->first();

                return [
                    'id' => $session->id,
                    'student_name' => $session->student->full_name,
                    'status' => $session->status,
                    'locked' => $session->isLocked(),
                    'locked_reason' => $session->locked_reason,
                    'started_at_label' => $session->started_at->translatedFormat('H:i'),
                    'remaining_seconds' => $session->status === 'ongoing' ? max(0, now()->diffInSeconds($session->deadline(), false)) : 0,
                    'answered_count' => $session->answers->count(),
                    'questions_count' => $questionsCount,
                    'last_activity_label' => $lastActivity ? Carbon::instance($lastActivity)->translatedFormat('H:i:s') : '—',
                    'violations_count' => $session->violations_count,
                    'warnings_count' => $session->warnings_count,
                    'flagged' => $session->violations_count >= ExamAuditLogger::VIOLATION_FLAG_THRESHOLD,
                    'last_violation_label' => $lastViolation?->event_type,
                ];
            })
            ->all();

        return Inertia::render('teacher/exams/monitor', [
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'subject' => $exam->subject->name,
                'class' => $exam->schoolClass->name,
                'status' => $exam->status,
                'questions_count' => $questionsCount,
                'participants_count' => $exam->schoolClass->students()->count(),
            ],
            'sessions' => $sessions,
        ]);
    }

    /**
     * Unlock a cheating-locked session. Only the exam's own teacher may do this.
     */
    public function unlockSession(Request $request, Exam $exam, ExamSession $session): RedirectResponse
    {
        $this->authorizeExam($request, $exam);
        abort_unless($session->exam_id === $exam->id, 404);

        $this->audit->unlock($session, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Ujian {$session->student->full_name} berhasil dibuka kembali."]);

        return back();
    }

    /**
     * Detailed per-student surveillance: every question's live answer state
     * plus the session's audit trail.
     */
    public function monitorSession(Request $request, Exam $exam, ExamSession $session): Response
    {
        $this->authorizeExam($request, $exam);
        abort_unless($session->exam_id === $exam->id, 404);

        $session->load(['student:id,full_name', 'answers']);
        $exam->load(['subject:id,name', 'schoolClass:id,name']);
        $questionsById = $exam->questions->load(['options', 'pairs'])->keyBy('id');

        $answersByQuestion = $session->answers->keyBy('question_id');
        $questions = collect($session->question_order)
            ->map(fn (int $questionId) => $questionsById->get($questionId))
            ->filter()
            ->values()
            ->map(function (Question $question, int $index) use ($answersByQuestion): array {
                $summary = $this->answerSummary($question, $answersByQuestion[$question->id]?->value ?? null);

                return [
                    'number' => $index + 1,
                    'id' => $question->id,
                    'content' => $question->content,
                    'type' => $question->type,
                    'weight' => $question->weight,
                    'answered' => $summary !== null,
                    'summary' => $summary,
                ];
            })
            ->all();

        $answeredCount = collect($questions)->where('answered', true)->count();
        $logs = $session->auditLogs()->latest('id')->limit(50)->get()->map(fn ($log): array => [
            'id' => $log->id,
            'event_type' => $log->event_type,
            'level' => $log->level,
            'metadata' => $log->metadata,
            'created_at_label' => $log->created_at->translatedFormat('d M H:i:s'),
        ])->all();

        return Inertia::render('teacher/exams/monitor-detail', [
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'subject' => $exam->subject->name,
                'class' => $exam->schoolClass->name,
            ],
            'session' => [
                'id' => $session->id,
                'student_name' => $session->student->full_name,
                'status' => $session->status,
                'locked' => $session->isLocked(),
                'locked_reason' => $session->locked_reason,
                'started_at_label' => $session->started_at->translatedFormat('d M Y H:i'),
                'remaining_seconds' => $session->status === 'ongoing' ? max(0, now()->diffInSeconds($session->deadline(), false)) : 0,
                'server_time' => now()->getTimestampMs(),
                'deadline' => $session->deadline()->getTimestampMs(),
                'answered_count' => $answeredCount,
                'questions_count' => count($questions),
                'violations_count' => $session->auditLogs()->whereIn('level', ['violation', 'critical'])->where('event_type', '!=', 'SESSION_LOCKED')->count(),
                'warnings_count' => $session->auditLogs()->where('level', 'warning')->count(),
                'questions' => $questions,
                'logs' => $logs,
            ],
        ]);
    }

    /**
     * Human readable snapshot of a student's saved answer for one question.
     *
     * @param  array<string, mixed>|null  $value
     */
    private function answerSummary(Question $question, ?array $value): ?string
    {
        if ($value === null || $value === []) {
            return null;
        }

        $summary = match ($question->type) {
            'multiple_choice', 'true_false' => $question->options->firstWhere('id', $value['option_id'] ?? null)?->content,
            'multiple_answers' => $question->options->whereIn('id', collect($value['option_ids'] ?? [])->map(fn ($id) => (int) $id))->pluck('content')->implode(', '),
            'statement_true_false' => collect($value['judgments'] ?? [])
                ->map(fn ($judgment, $optionId) => ($question->options->firstWhere('id', $optionId)?->content ?? '?').' → '.(filter_var($judgment, FILTER_VALIDATE_BOOLEAN) ? 'Benar' : 'Salah'))
                ->implode(' | '),
            'matching' => collect($value['matches'] ?? [])
                ->map(fn ($right, $pairId) => ($question->pairs->firstWhere('id', $pairId)?->left_text ?? '?').' → '.$right)
                ->implode(' | '),
            'essay' => trim((string) ($value['text'] ?? '')),
            default => null,
        };

        return $summary !== '' ? $summary : null;
    }

    /**
     * Resolve the teacher profile of the authenticated user.
     */
    private function profile(Request $request): Teacher
    {
        $teacher = $request->user()->teacher;

        abort_unless($teacher !== null, 404, 'Profil guru tidak ditemukan. Hubungi admin sekolah.');

        return $teacher;
    }

    private function authorizeExam(Request $request, Exam $exam): void
    {
        $teacher = $this->profile($request);

        abort_unless($exam->teacher_id === $teacher->id, 403, 'Ujian ini bukan milik Anda.');
    }

    /**
     * Validate that every picked question belongs to one of the teacher's banks.
     *
     * @return Collection<int, int>
     */
    private function ownedQuestionIds(ExamRequest $request, Teacher $teacher): Collection
    {
        $requested = collect($request->input('question_ids'))->map(fn ($id) => (int) $id)->unique()->values();

        $owned = Question::query()
            ->whereIn('id', $requested)
            ->whereHas('questionBank', fn ($query) => $query->where('teacher_id', $teacher->id))
            ->pluck('id');

        abort_unless($owned->count() === $requested->count(), 403, 'Ada soal yang bukan milik Anda.');

        return $owned;
    }

    /**
     * Build the pivot map for questions(): [question_id => ['sort_order' => n]].
     * sync() keys the array by relation id, so a plain list of pivot rows would
     * detach the wrong questions and duplicate rows on update.
     *
     * @param  Collection<int, int>  $questionIds
     * @return array<int, array<string, int>>
     */
    private function pivotMap(Collection $questionIds): array
    {
        return $questionIds
            ->values()
            ->mapWithKeys(fn (int $id, int $index): array => [$id => ['sort_order' => $index + 1]])
            ->all();
    }

    /**
     * Options for the create/edit form.
     *
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        $teacher = $this->profile($request);

        return [
            'subjects' => Subject::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn (Subject $subject): array => ['value' => $subject->id, 'label' => $subject->name])->all(),
            'classes' => SchoolClass::query()->orderBy('name')->get(['id', 'name'])->map(fn (SchoolClass $class): array => ['value' => $class->id, 'label' => $class->name])->all(),
            'banks' => QuestionBank::query()
                ->where('teacher_id', $teacher->id)
                ->with(['subject:id,name', 'questions:id,question_bank_id,content,type,difficulty,weight'])
                ->orderBy('name')
                ->get()
                ->map(fn (QuestionBank $bank): array => [
                    'id' => $bank->id,
                    'name' => $bank->name,
                    'subject_id' => $bank->subject_id,
                    'subject' => $bank->subject->name,
                    'material' => $bank->material,
                    'questions' => $bank->questions->map(fn (Question $question): array => [
                        'id' => $question->id,
                        'content' => $question->content,
                        'type' => $question->type,
                        'difficulty' => $question->difficulty,
                        'weight' => $question->weight,
                    ])->all(),
                ])
                ->all(),
        ];
    }

    /**
     * Session payload for the essay grading page.
     *
     * @return array<string, mixed>
     */
    private function gradingPayload(ExamSession $session): array
    {
        $result = $session->result;

        $essays = $result?->details
            ->filter(fn ($detail) => $detail->question->type === 'essay')
            ->values()
            ->map(fn ($detail): array => [
                'question_id' => $detail->question_id,
                'content' => $detail->question->content,
                'weight' => (float) $detail->question->weight,
                'student_text' => (string) ($detail->student_answer['text'] ?? ''),
                'earned' => (float) $detail->earned,
                'graded' => $detail->graded_at !== null,
            ])
            ->all() ?? [];

        return [
            'id' => $session->id,
            'student_name' => $session->student->full_name,
            'status' => $session->status,
            'submitted_at_label' => ($session->submitted_at ?? $session->started_at)->translatedFormat('d M Y H:i'),
            'pending_essays' => collect($essays)->where('graded', false)->count(),
            'essays' => $essays,
            'score' => $result?->score,
            'earned_score' => (float) ($result?->earned_score ?? 0),
            'max_score' => (float) ($result?->max_score ?? 0),
        ];
    }

    /**
     * Shared exam payload shape for index and show pages.
     *
     * @return array<string, mixed>
     */
    private function examPayload(Exam $exam): array
    {
        return [
            'id' => $exam->id,
            'name' => $exam->name,
            'subject' => $exam->subject->name,
            'class' => $exam->schoolClass->name,
            'started_at' => $exam->started_at->format('Y-m-d\TH:i'),
            'started_at_label' => $exam->started_at->translatedFormat('d M Y H:i'),
            'duration_minutes' => $exam->duration_minutes,
            'shuffle_questions' => $exam->shuffle_questions,
            'shuffle_options' => $exam->shuffle_options,
            'show_result_immediately' => $exam->show_result_immediately,
            'is_published' => $exam->is_published,
            'status' => $exam->status,
            'questions_count' => $exam->questions_count ?? $exam->questions()->count(),
        ];
    }
}
