<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Student;
use App\Services\ExamAuditLogger;
use App\Services\ExamAnswerValidator;
use App\Services\ExamRandomizer;
use App\Services\ExamScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The CBT engine for students: list exams, start a session, take the exam with
 * autosave, and submit for automatic scoring. All timing decisions are made
 * against server time, never the client clock (spec 14).
 */
class ExamController extends Controller
{
    public function __construct(private readonly ExamRandomizer $randomizer, private readonly ExamScorer $scorer, private readonly ExamAuditLogger $audit) {}

    /**
     * List the exams available to the student's class.
     */
    public function index(Request $request): Response
    {
        $student = $this->profile($request);

        $exams = Exam::query()
            ->where('is_published', true)
            ->whereIn('school_class_id', $student->classes()->pluck('classes.id'))
            ->with(['subject:id,name', 'schoolClass:id,name'])
            ->withCount('questions')
            ->orderBy('started_at')
            ->get();

        $sessions = ExamSession::query()
            ->where('student_id', $student->id)
            ->whereIn('exam_id', $exams->pluck('id'))
            ->get()
            ->keyBy('exam_id');

        return Inertia::render('student/exams/index', [
            'exams' => $exams->map(fn (Exam $exam): array => $this->examCard($exam, $sessions->get($exam->id)))->all(),
            'server_time' => now()->getTimestampMs(),
        ]);
    }

    /**
     * Start (or resume) an exam session after validating schedule and participation.
     */
    public function start(Request $request, Exam $exam): RedirectResponse
    {
        $student = $this->profile($request);

        abort_unless($exam->is_published, 404);

        $isParticipant = $student->classes()->whereKey($exam->school_class_id)->exists();
        if (! $isParticipant) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Anda bukan peserta ujian ini.']);

            return back();
        }

        $existing = ExamSession::query()
            ->where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existing !== null) {
            if ($existing->status !== 'ongoing') {
                return redirect()->route('student.exams.result', $existing);
            }

            if ($existing->isExpired()) {
                $this->finalize($existing, 'expired');

                return redirect()->route('student.exams.result', $existing);
            }

            return redirect()->route('student.exams.work', $existing);
        }

        $now = now();
        if ($now->lt($exam->started_at)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Ujian belum dimulai.']);

            return back();
        }

        if ($now->gt($exam->ends_at)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Waktu ujian sudah berakhir.']);

            return back();
        }

        $seed = random_int(1, 2_000_000_000);
        $session = ExamSession::query()->create([
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'started_at' => $now,
            'status' => 'ongoing',
            'random_seed' => $seed,
            'question_order' => $this->randomizer->questionOrder($exam, $seed),
        ]);

        $this->audit->forSession($session, 'START_EXAM', 'info', ['shuffled' => $exam->shuffle_questions]);

        return redirect()->route('student.exams.work', $session);
    }

    /**
     * The exam taking page: shuffled questions/options (without answer keys),
     * server deadline, and previously saved answers.
     */
    public function work(Request $request, ExamSession $session): Response|RedirectResponse
    {
        $this->authorizeSession($request, $session);

        if ($session->status !== 'ongoing') {
            return redirect()->route('student.exams.result', $session);
        }

        if ($session->isExpired()) {
            $this->finalize($session, 'expired');

            return redirect()->route('student.exams.result', $session);
        }

        $exam = $session->exam->load('subject:id,name');
        $questionsById = $exam->questions->load(['options', 'pairs'])->keyBy('id');

        $questions = collect($session->question_order)
            ->map(fn (int $questionId) => $questionsById->get($questionId))
            ->filter()
            ->values()
            ->map(fn ($question) => $this->questionPayload($exam, $session, $question))
            ->all();

        $answers = $session->answers->pluck('value', 'question_id')->all();

        return Inertia::render('student/exams/work', [
            'session' => [
                'id' => $session->id,
                'exam_name' => $exam->name,
                'subject' => $exam->subject->name,
                'server_time' => now()->getTimestampMs(),
                'deadline' => $session->deadline()->getTimestampMs(),
                'extra_time_minutes' => $session->extra_time_minutes,
                'locked' => $session->isLocked(),
                'locked_reason' => $session->locked_reason,
                'started_at_label' => $session->started_at->translatedFormat('d M Y H:i'),
            ],
            'questions' => $questions,
            'answers' => $answers,
        ]);
    }

    /**
     * Autosave endpoint. Accepts JSON; enforces the server deadline on every call.
     */
    public function saveAnswer(
        Request $request,
        ExamSession $session,
        ExamAnswerValidator $answerValidator,
    ): JsonResponse|RedirectResponse
    {
        $this->authorizeSession($request, $session);

        $validated = $request->validate([
            'question_id' => ['required', 'integer'],
            'value' => ['nullable', 'array', 'max:1'],
        ]);

        return DB::transaction(function () use ($session, $validated, $answerValidator): JsonResponse {
            $lockedSession = ExamSession::query()->whereKey($session->id)->lockForUpdate()->firstOrFail();

            if ($lockedSession->status !== 'ongoing') {
                return response()->json(['ok' => false, 'reason' => 'submitted'], 409);
            }

            if ($lockedSession->isExpired()) {
                $this->finalize($lockedSession, 'expired');

                return response()->json(['ok' => false, 'reason' => 'expired'], 409);
            }

            if ($lockedSession->isLocked()) {
                return response()->json(['ok' => false, 'reason' => 'locked'], 409);
            }

            $question = $lockedSession->exam->questions()
                ->with(['options', 'pairs'])
                ->whereKey($validated['question_id'])
                ->first();

            if ($question === null || ! in_array($question->id, $lockedSession->question_order, true)) {
                abort(422, 'Soal tidak termasuk dalam sesi ujian ini.');
            }

            $answerValidator->validate($question, $validated['value'] ?? null);

            Answer::query()->updateOrCreate(
                ['exam_session_id' => $lockedSession->id, 'question_id' => $question->id],
                ['value' => $validated['value'] ?? null],
            );

            return response()->json(['ok' => true, 'saved_at' => now()->getTimestampMs()]);
        });
    }

    /**
     * Receive security events from the exam client (window blur/focus, fullscreen exit).
     * Event types and levels are whitelisted server-side (spec 5.2 & 5.4).
     */
    public function securityEvent(Request $request, ExamSession $session): JsonResponse
    {
        $this->authorizeSession($request, $session);

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(array_keys(ExamAuditLogger::SECURITY_EVENT_LEVELS))],
            'metadata' => ['nullable', 'array', 'max:8'],
        ]);

        $metadata = $validated['metadata'] ?? [];
        if (collect($metadata)->contains(fn ($value) => ! is_scalar($value) && $value !== null)
            || strlen(json_encode($metadata) ?: '') > 1024) {
            throw ValidationException::withMessages(['metadata' => 'Metadata kejadian keamanan terlalu besar atau tidak valid.']);
        }

        return DB::transaction(function () use ($session, $validated, $metadata): JsonResponse {
            $lockedSession = ExamSession::query()->whereKey($session->id)->lockForUpdate()->firstOrFail();

            if ($lockedSession->status !== 'ongoing' || $lockedSession->isExpired()) {
                return response()->json(['ok' => true, 'recorded' => false, 'locked' => $lockedSession->isLocked()]);
            }

            $logged = $this->audit->securityEvent($lockedSession, $validated['type'], $metadata);
            $autoLockEvent = in_array($validated['type'], ['WINDOW_BLUR', 'FULLSCREEN_EXIT'], true);
            if ($autoLockEvent && ! $lockedSession->isLocked()) {
                $reason = $validated['type'] === 'FULLSCREEN_EXIT'
                    ? 'Sesi dikunci otomatis karena siswa keluar dari mode layar penuh.'
                    : 'Sesi dikunci otomatis karena siswa berpindah fokus dari halaman ujian.';
                $this->audit->lock($lockedSession, $reason);
            }

            return response()->json([
                'ok' => true,
                'recorded' => $logged !== null,
                'locked' => $lockedSession->fresh()->isLocked(),
                'locked_reason' => $lockedSession->fresh()->locked_reason,
            ]);
        });
    }

    /** Let the student screen learn when a teacher manually locks the session. */
    public function sessionStatus(Request $request, ExamSession $session): JsonResponse
    {
        $this->authorizeSession($request, $session);

        return response()->json([
            'status' => $session->status,
            'locked' => $session->isLocked(),
            'locked_reason' => $session->locked_reason,
            'server_time' => now()->getTimestampMs(),
            'deadline' => $session->deadline()->getTimestampMs(),
            'extra_time_minutes' => $session->extra_time_minutes,
        ]);
    }

    /**
     * Submit the exam (manually or because time ran out) and score it.
     */
    public function submit(Request $request, ExamSession $session): RedirectResponse
    {
        $this->authorizeSession($request, $session);

        $notExpired = DB::transaction(function () use ($session): bool {
            $lockedSession = ExamSession::query()->whereKey($session->id)->lockForUpdate()->firstOrFail();

            if ($lockedSession->status !== 'ongoing') {
                return false;
            }

            $expired = $lockedSession->isExpired();
            if (! $expired && $lockedSession->isLocked()) {
                abort(423, 'Sesi ujian terkunci. Hubungi guru atau pengawas untuk meninjau sesi ini.');
            }
            if (! $expired) {
                return true;
            }

            $lockedSession->update([
                'status' => $expired ? 'expired' : 'submitted',
                'submitted_at' => now(),
            ]);
            $this->scorer->score($lockedSession);
            $this->audit->forSession($lockedSession, 'TIME_EXPIRED', 'info', ['manual' => false]);

            return false;
        });

        if ($notExpired) {
            return redirect()->route('student.exams.work', $session);
        }

        return redirect()->route('student.exams.result', $session);
    }

    /**
     * Result page; the score and review are gated by the exam's result policy.
     */
    public function result(Request $request, ExamSession $session): Response|RedirectResponse
    {
        $this->authorizeSession($request, $session);

        if ($session->status === 'ongoing') {
            return redirect()->route('student.exams.work', $session);
        }

        $exam = $session->exam->load('subject:id,name');
        $result = $session->result;

        $showScore = $result !== null && $exam->show_result_immediately;
        $details = [];

        if ($showScore && $result !== null) {
            $orderedQuestions = collect($session->question_order);
            $details = $result->details->load('question:id,content,type,weight,image_path')
                ->sortBy(fn ($detail) => $orderedQuestions->search($detail->question_id))
                ->values()
                ->map(fn ($detail): array => [
                    'question_id' => $detail->question_id,
                    'content' => $detail->question->content,
                    'type' => $detail->question->type,
                    'weight' => $detail->question->weight,
                    'image_url' => $detail->question->image_url,
                    'earned' => (float) $detail->earned,
                    'max' => (float) $detail->max,
                    'is_correct' => $detail->is_correct,
                    'student_answer' => $detail->student_answer,
                    'correct_answer' => $detail->correct_answer,
                ])
                ->all();
        }

        return Inertia::render('student/exams/result', [
            'session' => [
                'id' => $session->id,
                'exam_name' => $exam->name,
                'subject' => $exam->subject->name,
                'submitted_at_label' => ($session->submitted_at ?? $session->started_at)->translatedFormat('d M Y H:i'),
                'status' => $session->status,
            ],
            'show_score' => $showScore,
            'result' => $result === null ? null : [
                'score' => $result->score,
                'earned_score' => (float) $result->earned_score,
                'max_score' => (float) $result->max_score,
                'correct_count' => $result->correct_count,
                'question_count' => $result->question_count,
                'has_essay_pending' => $result->has_essay_pending,
                'details' => $details,
            ],
        ]);
    }

    /**
     * Score history for the student (spec 6.3).
     */
    public function history(Request $request): Response
    {
        $student = $this->profile($request);

        $rows = ExamSession::query()
            ->where('student_id', $student->id)
            ->where('status', '!=', 'ongoing')
            ->with(['exam.subject:id,name', 'result'])
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn (ExamSession $session): array => [
                'id' => $session->id,
                'exam_name' => $session->exam->name,
                'subject' => $session->exam->subject->name,
                'submitted_at_label' => ($session->submitted_at ?? $session->started_at)->translatedFormat('d M Y H:i'),
                'status' => $session->status,
                'score' => $session->exam->show_result_immediately ? $session->result?->score : null,
                'has_essay_pending' => $session->result?->has_essay_pending ?? false,
            ])
            ->all();

        return Inertia::render('student/results/index', ['results' => $rows]);
    }

    /**
     * Resolve the student profile of the authenticated user.
     */
    private function profile(Request $request): Student
    {
        $student = $request->user()->student;

        abort_unless($student !== null, 404, 'Profil siswa tidak ditemukan. Hubungi admin sekolah.');

        return $student;
    }

    private function authorizeSession(Request $request, ExamSession $session): void
    {
        $student = $this->profile($request);

        abort_unless($session->student_id === $student->id, 403, 'Sesi ujian ini bukan milik Anda.');
    }

    /**
     * Close the session, persist the submit time, and run the auto scorer.
     */
    private function finalize(ExamSession $session, string $status): void
    {
        if ($session->status === 'ongoing') {
            $session->update(['status' => $status, 'submitted_at' => now()]);
            $this->scorer->score($session);
            $this->audit->forSession($session, $status === 'expired' ? 'TIME_EXPIRED' : 'SESSION_EXPIRED', 'warning');
        }
    }

    /**
     * Card payload for the exam list.
     *
     * @return array<string, mixed>
     */
    private function examCard(Exam $exam, ?ExamSession $session): array
    {
        return [
            'id' => $exam->id,
            'name' => $exam->name,
            'subject' => $exam->subject->name,
            'class' => $exam->schoolClass->name,
            'started_at_label' => $exam->started_at->translatedFormat('d M Y H:i'),
            'ends_at_label' => $exam->ends_at->translatedFormat('d M Y H:i'),
            'starts_at' => $exam->started_at->getTimestampMs(),
            'ends_at' => $exam->ends_at->getTimestampMs(),
            'duration_minutes' => $exam->duration_minutes,
            'questions_count' => $exam->questions_count,
            'status' => $exam->status,
            'show_result_immediately' => $exam->show_result_immediately,
            'session' => $session === null ? null : [
                'id' => $session->id,
                'status' => $session->status,
            ],
        ];
    }

    /**
     * Question payload for the taking page. Answer keys (is_correct) are never sent
     * to the client; option order follows the session seed.
     *
     * @return array<string, mixed>
     */
    private function questionPayload(Exam $exam, ExamSession $session, object $question): array
    {
        $optionIds = $this->randomizer->optionOrder($exam, $question, $session->random_seed, $question->options);
        $optionsById = $question->options->keyBy('id');

        $rightPool = $question->pairs
            ->map(fn ($pair): array => ['text' => $pair->right_text, 'image_url' => $pair->right_image_url])
            ->all();
        if ($exam->shuffle_options && count($rightPool) > 1) {
            $rightPool = $this->randomizer->shufflePool($rightPool, $session->random_seed + $question->id);
        }

        return [
            'id' => $question->id,
            'content' => $question->content,
            'stimulus' => $question->stimulus,
            'type' => $question->type,
            'weight' => $question->weight,
            'image_url' => $question->image_url,
            'options' => collect($optionIds)->map(fn (int $id): array => [
                'id' => $id,
                'content' => $optionsById[$id]->content,
                'image_url' => $optionsById[$id]->image_url,
            ])->all(),
            'pairs' => $question->pairs->map(fn ($pair): array => [
                'id' => $pair->id,
                'left_text' => $pair->left_text,
                'left_image_url' => $pair->left_image_url,
            ])->all(),
            'right_pool' => array_values($rightPool),
        ];
    }
}
