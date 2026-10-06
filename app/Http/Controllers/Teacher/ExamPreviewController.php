<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Teacher;
use App\Services\ExamRandomizer;
use App\Services\ExamScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Allows a teacher to preview/test their own exam before publishing.
 * Preview sessions use is_preview = true and student_id = null so they never
 * appear in real exam results or monitoring views.
 */
class ExamPreviewController extends Controller
{
    public function __construct(
        private readonly ExamRandomizer $randomizer,
        private readonly ExamScorer $scorer,
    ) {}

    /**
     * Start (or restart) a preview session. Old preview sessions for this
     * teacher+exam are deleted to keep things clean.
     */
    public function start(Request $request, Exam $exam): RedirectResponse
    {
        $teacher = $this->profile($request);
        $this->authorizeExam($exam, $teacher);

        abort_unless($exam->questions()->exists(), 422, 'Ujian belum memiliki soal. Tambahkan soal terlebih dahulu sebelum uji coba.');

        // Clean up old preview sessions for this exam so we start fresh.
        ExamSession::query()
            ->where('exam_id', $exam->id)
            ->where('is_preview', true)
            ->whereNull('student_id')
            ->delete();

        $seed = random_int(1, 2_000_000_000);
        $session = ExamSession::query()->create([
            'exam_id'        => $exam->id,
            'student_id'     => null,
            'is_preview'     => true,
            'started_at'     => now(),
            'status'         => 'ongoing',
            'random_seed'    => $seed,
            'question_order' => $this->randomizer->questionOrder($exam, $seed),
        ]);

        return redirect()->route('teacher.exams.preview.work', ['exam' => $exam->id, 'session' => $session->id]);
    }

    /**
     * The exam-taking page in preview mode.
     */
    public function work(Request $request, Exam $exam, ExamSession $session): Response|RedirectResponse
    {
        $teacher = $this->profile($request);
        $this->authorizeExam($exam, $teacher);
        $this->authorizeSession($exam, $session);

        if ($session->status !== 'ongoing') {
            return redirect()->route('teacher.exams.preview.result', ['exam' => $exam->id, 'session' => $session->id]);
        }

        $exam->load('subject:id,name');
        $questionsById = $exam->questions->load(['options', 'pairs'])->keyBy('id');

        $questions = collect($session->question_order)
            ->map(fn (int $questionId) => $questionsById->get($questionId))
            ->filter()
            ->values()
            ->map(fn ($question) => $this->questionPayload($exam, $session, $question))
            ->all();

        $answers = $session->answers->pluck('value', 'question_id')->all();

        return Inertia::render('teacher/exams/preview-work', [
            'exam'     => ['id' => $exam->id, 'name' => $exam->name],
            'session'  => [
                'id'              => $session->id,
                'exam_name'       => $exam->name,
                'subject'         => $exam->subject->name,
                'server_time'     => now()->getTimestampMs(),
                'deadline'        => $session->deadline()->getTimestampMs(),
                'started_at_label'=> $session->started_at->translatedFormat('d M Y H:i'),
            ],
            'questions' => $questions,
            'answers'   => $answers,
        ]);
    }

    /**
     * Autosave endpoint for preview (no security logging, no lock checks).
     */
    public function saveAnswer(Request $request, Exam $exam, ExamSession $session): JsonResponse
    {
        $teacher = $this->profile($request);
        $this->authorizeExam($exam, $teacher);
        $this->authorizeSession($exam, $session);

        $validated = $request->validate([
            'question_id' => ['required', 'integer'],
            'value'       => ['nullable', 'array'],
        ]);

        $isExamQuestion = $session->exam->questions()->whereKey($validated['question_id'])->exists();
        if (! $isExamQuestion) {
            abort(422, 'Soal tidak termasuk dalam ujian ini.');
        }

        if ($session->status !== 'ongoing') {
            return response()->json(['ok' => false, 'reason' => 'submitted'], 409);
        }

        Answer::query()->updateOrCreate(
            ['exam_session_id' => $session->id, 'question_id' => $validated['question_id']],
            ['value' => $validated['value']],
        );

        return response()->json(['ok' => true, 'saved_at' => now()->getTimestampMs()]);
    }

    /**
     * Submit the preview session and score it immediately (always show result).
     */
    public function submit(Request $request, Exam $exam, ExamSession $session): RedirectResponse
    {
        $teacher = $this->profile($request);
        $this->authorizeExam($exam, $teacher);
        $this->authorizeSession($exam, $session);

        if ($session->status === 'ongoing') {
            $expired = $session->isExpired();
            $session->update([
                'status'       => $expired ? 'expired' : 'submitted',
                'submitted_at' => now(),
            ]);
            $this->scorer->score($session);
        }

        return redirect()->route('teacher.exams.preview.result', ['exam' => $exam->id, 'session' => $session->id]);
    }

    /**
     * Preview result page — always shows full score and details.
     */
    public function result(Request $request, Exam $exam, ExamSession $session): Response
    {
        $teacher = $this->profile($request);
        $this->authorizeExam($exam, $teacher);
        $this->authorizeSession($exam, $session);

        $exam->load('subject:id,name');
        $result = $session->result;

        $details = [];
        if ($result !== null) {
            $orderedQuestions = collect($session->question_order);
            $details = $result->details->load('question:id,content,type,weight,image_path')
                ->sortBy(fn ($detail) => $orderedQuestions->search($detail->question_id))
                ->values()
                ->map(fn ($detail): array => [
                    'question_id'    => $detail->question_id,
                    'content'        => $detail->question->content,
                    'type'           => $detail->question->type,
                    'weight'         => $detail->question->weight,
                    'image_url'      => $detail->question->image_url,
                    'earned'         => (float) $detail->earned,
                    'max'            => (float) $detail->max,
                    'is_correct'     => $detail->is_correct,
                    'student_answer' => $detail->student_answer,
                    'correct_answer' => $detail->correct_answer,
                ])
                ->all();
        }

        return Inertia::render('teacher/exams/preview-result', [
            'exam'    => ['id' => $exam->id, 'name' => $exam->name],
            'session' => [
                'id'                => $session->id,
                'exam_name'         => $exam->name,
                'subject'           => $exam->subject->name,
                'submitted_at_label'=> ($session->submitted_at ?? $session->started_at)->translatedFormat('d M Y H:i'),
                'status'            => $session->status,
            ],
            'result'  => $result === null ? null : [
                'score'              => $result->score,
                'earned_score'       => (float) $result->earned_score,
                'max_score'          => (float) $result->max_score,
                'correct_count'      => $result->correct_count,
                'question_count'     => $result->question_count,
                'has_essay_pending'  => $result->has_essay_pending,
                'details'            => $details,
            ],
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function profile(Request $request): Teacher
    {
        $teacher = $request->user()->teacher;
        abort_unless($teacher !== null, 404, 'Profil guru tidak ditemukan.');

        return $teacher;
    }

    private function authorizeExam(Exam $exam, Teacher $teacher): void
    {
        abort_unless($exam->teacher_id === $teacher->id, 403, 'Anda bukan pemilik ujian ini.');
    }

    private function authorizeSession(Exam $exam, ExamSession $session): void
    {
        abort_unless(
            $session->exam_id === $exam->id && $session->is_preview,
            403,
            'Sesi uji coba tidak valid.'
        );
    }

    /**
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
            'id'       => $question->id,
            'content'  => $question->content,
            'stimulus' => $question->stimulus,
            'type'     => $question->type,
            'weight'   => $question->weight,
            'image_url'=> $question->image_url,
            'options'  => collect($optionIds)->map(fn (int $id): array => [
                'id'        => $id,
                'content'   => $optionsById[$id]->content,
                'image_url' => $optionsById[$id]->image_url,
            ])->all(),
            'pairs'    => $question->pairs->map(fn ($pair): array => [
                'id'            => $pair->id,
                'left_text'     => $pair->left_text,
                'left_image_url'=> $pair->left_image_url,
            ])->all(),
            'right_pool' => array_values($rightPool),
        ];
    }
}

