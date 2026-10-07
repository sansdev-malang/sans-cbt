<?php

namespace App\Http\Controllers\Admin;

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
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    public function __construct(private readonly QuestionWriter $questionWriter) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('admin/questions/index', [
            'banks' => QuestionBank::query()
                ->with(['subject:id,name', 'schoolClass:id,name', 'teacher:id,full_name', 'questions:id,question_bank_id,content,type,difficulty,weight'])
                ->withCount('questions')
                ->latest()
                ->get()
                ->map(fn (QuestionBank $bank): array => $this->bankPayload($bank))
                ->all(),
            'subjects' => Subject::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn (Subject $subject): array => ['value' => $subject->id, 'label' => $subject->name])->all(),
            'classes' => SchoolClass::query()->orderBy('name')->get(['id', 'name'])->map(fn (SchoolClass $class): array => ['value' => $class->id, 'label' => $class->name])->all(),
            'teachers' => Teacher::query()->orderBy('full_name')->get(['id', 'full_name'])->map(fn (Teacher $teacher): array => ['value' => $teacher->id, 'label' => $teacher->full_name])->all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(QuestionRequest $request): RedirectResponse
    {
        $this->questionWriter->create($request);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil ditambahkan.']);

        return back();
    }

    public function storeBank(QuestionBankRequest $request): RedirectResponse
    {
        $bank = QuestionBank::query()->create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bank soal berhasil ditambahkan.']);

        // Land on the new bank so questions can be added right away.
        return redirect()->route('admin.question-banks.show', $bank);
    }

    /**
     * Display one question bank with all of its questions.
     */
    public function showBank(QuestionBank $questionBank): Response
    {
        $questionBank->loadCount('questions')
            ->load([
                'subject:id,name',
                'schoolClass:id,name',
                'teacher:id,full_name',
                'questions' => fn ($query) => $query->select('id', 'question_bank_id', 'content', 'stimulus', 'type', 'difficulty', 'weight', 'image_path')->with(['options', 'pairs']),
            ]);

        return Inertia::render('admin/questions/bank', [
            'bank' => $this->bankPayload($questionBank, detailed: true),
            'subjects' => Subject::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn (Subject $subject): array => ['value' => $subject->id, 'label' => $subject->name])->all(),
            'classes' => SchoolClass::query()->orderBy('name')->get(['id', 'name'])->map(fn (SchoolClass $class): array => ['value' => $class->id, 'label' => $class->name])->all(),
            'teachers' => Teacher::query()->orderBy('full_name')->get(['id', 'full_name'])->map(fn (Teacher $teacher): array => ['value' => $teacher->id, 'label' => $teacher->full_name])->all(),
        ]);
    }

    public function updateBank(QuestionBankRequest $request, QuestionBank $questionBank): RedirectResponse
    {
        $questionBank->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bank soal berhasil diperbarui.']);

        return back();
    }

    public function destroyBank(QuestionBank $questionBank): RedirectResponse
    {
        $questionBank->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bank soal berhasil dihapus.']);

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Question $question): Response
    {
        return Inertia::render('admin/questions/show', [
            'question' => $question->load(['options', 'pairs', 'questionBank:id,name']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(QuestionRequest $request, Question $question): RedirectResponse
    {
        $this->questionWriter->update($question, $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil diperbarui.']);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Question $question): RedirectResponse
    {
        $this->questionWriter->delete($question);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil dihapus.']);

        return redirect()->route('admin.questions.index');
    }

    /**
     * Shared shape for bank cards on both admin and teacher pages.
     * $detailed adds options/pairs/images for the edit modal on the detail page.
     *
     * @return array<string, mixed>
     */
    protected function bankPayload(QuestionBank $bank, bool $detailed = false): array
    {
        return [
            'id' => $bank->id,
            'name' => $bank->name,
            'subject' => $bank->subject->name,
            'subject_id' => $bank->subject_id,
            'school_class_id' => $bank->school_class_id,
            'teacher_id' => $bank->teacher_id,
            'class' => $bank->schoolClass?->name,
            'teacher' => $bank->teacher?->full_name,
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
