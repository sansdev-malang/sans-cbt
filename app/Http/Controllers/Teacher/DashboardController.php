<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the teacher dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $teacher = $request->user()->teacher;

        if ($teacher === null) {
            return Inertia::render('teacher/dashboard', [
                'teacher_name' => $request->user()->name,
                'stats' => [
                    ['label' => 'Bank Soal', 'value' => 0],
                    ['label' => 'Total Soal', 'value' => 0],
                    ['label' => 'Ujian Terpublikasi', 'value' => 0],
                    ['label' => 'Kelas Diuji', 'value' => 0],
                ],
                'upcomingExams' => [],
            ]);
        }

        $bankCount = QuestionBank::query()->where('teacher_id', $teacher->id)->count();
        $questionCount = Question::query()->whereHas('questionBank', fn ($query) => $query->where('teacher_id', $teacher->id))->count();
        $publishedCount = Exam::query()->where('teacher_id', $teacher->id)->where('is_published', true)->count();
        $classCount = Exam::query()->where('teacher_id', $teacher->id)->distinct('school_class_id')->count('school_class_id');

        $upcomingExams = Exam::query()
            ->where('teacher_id', $teacher->id)
            ->where('is_published', true)
            ->where('started_at', '>=', now())
            ->with(['subject:id,name', 'schoolClass:id,name'])
            ->withCount('questions')
            ->orderBy('started_at')
            ->limit(5)
            ->get()
            ->map(fn (Exam $exam): array => [
                'id' => $exam->id,
                'name' => $exam->name,
                'subject' => $exam->subject->name,
                'class' => $exam->schoolClass->name,
                'started_at_label' => $exam->started_at->translatedFormat('d M Y H:i'),
                'duration_minutes' => $exam->duration_minutes,
                'questions_count' => $exam->questions_count,
            ])
            ->all();

        return Inertia::render('teacher/dashboard', [
            'teacher_name' => $teacher->full_name,
            'stats' => [
                ['label' => 'Bank Soal', 'value' => $bankCount],
                ['label' => 'Total Soal', 'value' => $questionCount],
                ['label' => 'Ujian Terpublikasi', 'value' => $publishedCount],
                ['label' => 'Kelas Diuji', 'value' => $classCount],
            ],
            'upcomingExams' => $upcomingExams,
        ]);
    }
}
