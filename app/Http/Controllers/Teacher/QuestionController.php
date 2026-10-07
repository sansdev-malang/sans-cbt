<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuestionBankRequest;
use App\Http\Requests\Admin\QuestionRequest;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\QuestionWriter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Question bank area for teachers: every bank and question is scoped to the
 * teacher profile linked to the authenticated user.
 */
class QuestionController extends Controller
{
    public function __construct(private readonly QuestionWriter $questionWriter) {}

    /**
     * Display the teacher's question banks.
     */
    public function index(Request $request): Response
    {
        $teacher = $this->profile($request);

        return Inertia::render('teacher/questions/index', [
            'banks' => QuestionBank::query()
                ->where('teacher_id', $teacher->id)
                ->with(['subject:id,name', 'schoolClass:id,name', 'questions:id,question_bank_id,content,type,difficulty,weight'])
                ->withCount('questions')
                ->latest()
                ->get()
                ->map(fn (QuestionBank $bank): array => $this->bankPayload($bank))
                ->all(),
            'subjects' => Subject::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn (Subject $subject): array => ['value' => $subject->id, 'label' => $subject->name])->all(),
            'classes' => SchoolClass::query()->orderBy('name')->get(['id', 'name'])->map(fn (SchoolClass $class): array => ['value' => $class->id, 'label' => $class->name])->all(),
        ]);
    }

    /**
     * Store a newly created question in one of the teacher's banks.
     */
    public function store(QuestionRequest $request): RedirectResponse
    {
        $this->assertBankOwnership($request);
        $this->questionWriter->create($request);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil ditambahkan.']);

        return back();
    }

    public function storeBank(QuestionBankRequest $request): RedirectResponse
    {
        $teacher = $this->profile($request);

        $bank = QuestionBank::query()->create([...$request->validated(), 'teacher_id' => $teacher->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bank soal berhasil ditambahkan.']);

        // Land on the new bank so questions can be added right away.
        return redirect()->route('teacher.question-banks.show', $bank);
    }

    /**
     * Display one of the teacher's question banks with all of its questions.
     */
    public function showBank(Request $request, QuestionBank $questionBank): Response
    {
        $this->authorizeBank($request, $questionBank);

        $questionBank->loadCount('questions')
            ->load([
                'subject:id,name',
                'schoolClass:id,name',
                'questions' => fn ($query) => $query->select('id', 'question_bank_id', 'content', 'stimulus', 'type', 'difficulty', 'weight', 'image_path')->with(['options', 'pairs']),
            ]);

        return Inertia::render('teacher/questions/bank', [
            'bank' => $this->bankPayload($questionBank, detailed: true),
            'subjects' => Subject::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn (Subject $subject): array => ['value' => $subject->id, 'label' => $subject->name])->all(),
            'classes' => SchoolClass::query()->orderBy('name')->get(['id', 'name'])->map(fn (SchoolClass $class): array => ['value' => $class->id, 'label' => $class->name])->all(),
        ]);
    }

    public function updateBank(QuestionBankRequest $request, QuestionBank $questionBank): RedirectResponse
    {
        $this->authorizeBank($request, $questionBank);

        $questionBank->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bank soal berhasil diperbarui.']);

        return back();
    }

    public function destroyBank(Request $request, QuestionBank $questionBank): RedirectResponse
    {
        $this->authorizeBank($request, $questionBank);

        $questionBank->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bank soal berhasil dihapus.']);

        return back();
    }

    /**
     * Display the specified question.
     */
    public function show(Request $request, Question $question): Response
    {
        $this->authorizeQuestion($request, $question);

        return Inertia::render('teacher/questions/show', [
            'question' => $question->load(['options', 'pairs', 'questionBank:id,name']),
        ]);
    }

    /**
     * Update the specified question.
     */
    public function update(QuestionRequest $request, Question $question): RedirectResponse
    {
        $this->authorizeQuestion($request, $question);
        $this->questionWriter->update($question, $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil diperbarui.']);

        return back();
    }

    /**
     * Remove the specified question.
     */
    public function destroy(Request $request, Question $question): RedirectResponse
    {
        $this->authorizeQuestion($request, $question);
        $this->questionWriter->delete($question);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil dihapus.']);

        return redirect()->route('teacher.questions.index');
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

    /**
     * Ensure the target bank of a new question belongs to the teacher.
     */
    private function assertBankOwnership(QuestionRequest $request): void
    {
        $teacher = $this->profile($request);

        $exists = QuestionBank::query()
            ->where('id', $request->integer('question_bank_id'))
            ->where('teacher_id', $teacher->id)
            ->exists();

        abort_unless($exists, 403, 'Bank soal bukan milik Anda.');
    }

    private function authorizeQuestion(Request $request, Question $question): void
    {
        $teacher = $this->profile($request);

        abort_unless($question->questionBank !== null && $question->questionBank->teacher_id === $teacher->id, 403, 'Soal ini bukan milik Anda.');
    }

    private function authorizeBank(Request $request, QuestionBank $questionBank): void
    {
        $teacher = $this->profile($request);

        abort_unless($questionBank->teacher_id === $teacher->id, 403, 'Bank soal bukan milik Anda.');
    }

    /**
     * Shared shape for bank cards on the teacher page.
     *
     * @return array<string, mixed>
     */
    private function bankPayload(QuestionBank $bank, bool $detailed = false): array
    {
        return [
            'id' => $bank->id,
            'name' => $bank->name,
            'subject' => $bank->subject->name,
            'subject_id' => $bank->subject_id,
            'school_class_id' => $bank->school_class_id,
            'class' => $bank->schoolClass?->name,
            'material' => $bank->material,
            'questions_count' => $bank->questions_count,
            'questions' => $bank->questions->map(function (Question $question) use ($detailed): array {
                $payload = [
                    'id' => $question->id,
                    'content' => $question->content,
                    'stimulus' => $question->stimulus,
                    'type' => $question->type,
                    'difficulty' => $question->difficulty,
                    'weight' => $question->weight,
                ];

                if ($detailed) {
                    $payload['image_path'] = $question->image_path;
                    $payload['image_url'] = $question->image_url;
                    $payload['options'] = $question->options->map(fn ($option): array => [
                        'id' => $option->id,
                        'label' => $option->label,
                        'content' => $option->content,
                        'is_correct' => $option->is_correct,
                        'image_path' => $option->image_path,
                        'image_url' => $option->image_url,
                    ])->all();
                    $payload['pairs'] = $question->pairs->map(fn ($pair): array => [
                        'id' => $pair->id,
                        'left_text' => $pair->left_text,
                        'right_text' => $pair->right_text,
                        'left_image_path' => $pair->left_image_path,
                        'left_image_url' => $pair->left_image_url,
                        'right_image_path' => $pair->right_image_path,
                        'right_image_url' => $pair->right_image_url,
                    ])->all();
                }

                return $payload;
            })->all(),
        ];
    }
}
