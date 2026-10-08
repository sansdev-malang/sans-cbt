<?php

use App\Http\Controllers\Admin\AuditLogController as AdminAuditLogController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ExamMonitorController as AdminExamMonitorController;
use App\Http\Controllers\Admin\QuestionController as AdminQuestionController;
use App\Http\Controllers\Admin\QuestionMediaController as AdminQuestionMediaController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\SchoolClassController as AdminSchoolClassController;
use App\Http\Controllers\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Admin\SubjectController as AdminSubjectController;
use App\Http\Controllers\Admin\TeacherController as AdminTeacherController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Student\ExamController as StudentExamController;
use App\Http\Controllers\Teacher\DashboardController as TeacherDashboardController;
use App\Http\Controllers\Teacher\ExamController as TeacherExamController;
use App\Http\Controllers\Teacher\ExamPreviewController as TeacherExamPreviewController;
use App\Http\Controllers\Teacher\QuestionController as TeacherQuestionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');

        Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('users', [AdminUserController::class, 'store'])->name('users.store');
        Route::patch('users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

        Route::get('subjects', [AdminSubjectController::class, 'index'])->name('subjects.index');
        Route::get('subjects/create', [AdminSubjectController::class, 'create'])->name('subjects.create');
        Route::post('subjects', [AdminSubjectController::class, 'store'])->name('subjects.store');
        Route::get('subjects/{subject}/edit', [AdminSubjectController::class, 'edit'])->name('subjects.edit');
        Route::patch('subjects/{subject}', [AdminSubjectController::class, 'update'])->name('subjects.update');
        Route::delete('subjects/{subject}', [AdminSubjectController::class, 'destroy'])->name('subjects.destroy');

        Route::get('classes', [AdminSchoolClassController::class, 'index'])->name('classes.index');
        Route::get('classes/create', [AdminSchoolClassController::class, 'create'])->name('classes.create');
        Route::post('classes', [AdminSchoolClassController::class, 'store'])->name('classes.store');
        Route::get('classes/{class}/edit', [AdminSchoolClassController::class, 'edit'])->name('classes.edit');
        Route::patch('classes/{class}', [AdminSchoolClassController::class, 'update'])->name('classes.update');
        Route::delete('classes/{class}', [AdminSchoolClassController::class, 'destroy'])->name('classes.destroy');

        Route::resource('students', AdminStudentController::class)->except('show');
        Route::resource('teachers', AdminTeacherController::class)->except('show');
        Route::resource('questions', AdminQuestionController::class)->except(['create', 'edit']);
        Route::get('question-banks', fn () => redirect()->route('admin.questions.index'))->name('question-banks.index');
        Route::get('question-banks/{questionBank}', [AdminQuestionController::class, 'showBank'])->name('question-banks.show');
        Route::post('question-banks', [AdminQuestionController::class, 'storeBank'])->name('question-banks.store');
        Route::put('question-banks/{questionBank}', [AdminQuestionController::class, 'updateBank'])->name('question-banks.update');
        Route::delete('question-banks/{questionBank}', [AdminQuestionController::class, 'destroyBank'])->name('question-banks.destroy');

        Route::inertia('people', 'admin/people/index')->name('people.index');
        Route::get('exam-monitoring', AdminExamMonitorController::class)->name('exam-monitoring.index');
        Route::get('audit-logs', [AdminAuditLogController::class, 'index'])->name('audit-logs.index');
        Route::delete('audit-logs', [AdminAuditLogController::class, 'purge'])->name('audit-logs.purge');
        Route::get('reports', [AdminReportController::class, 'index'])->name('reports.index');
    });

// Question media is stored on the private disk and accessible to all authenticated users (admin, teacher, student).
// Question media: admin & guru mengelola bank soal, siswa butuh gambar saat mengerjakan ujian.
// Nama file acak (hash) sehingga tidak bisa ditebak; orang tua & tamu ditolak.
Route::middleware(['auth', 'verified', 'role:admin,guru,siswa'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('question-media/{path}', AdminQuestionMediaController::class)
            ->where('path', '[A-Za-z0-9._-]+')
            ->name('question-media.show');
    });

Route::middleware(['auth', 'verified', 'role:guru'])
    ->prefix('teacher')
    ->name('teacher.')
    ->group(function () {
        Route::get('/', TeacherDashboardController::class)->name('dashboard');

        Route::get('questions', [TeacherQuestionController::class, 'index'])->name('questions.index');
        Route::post('questions', [TeacherQuestionController::class, 'store'])->name('questions.store');
        Route::get('questions/{question}', [TeacherQuestionController::class, 'show'])->name('questions.show');
        Route::put('questions/{question}', [TeacherQuestionController::class, 'update'])->name('questions.update');
        Route::delete('questions/{question}', [TeacherQuestionController::class, 'destroy'])->name('questions.destroy');
        Route::get('question-banks', fn () => redirect()->route('teacher.questions.index'))->name('question-banks.index');
        Route::get('question-banks/{questionBank}', [TeacherQuestionController::class, 'showBank'])->name('question-banks.show');
        Route::post('question-banks', [TeacherQuestionController::class, 'storeBank'])->name('question-banks.store');
        Route::put('question-banks/{questionBank}', [TeacherQuestionController::class, 'updateBank'])->name('question-banks.update');
        Route::delete('question-banks/{questionBank}', [TeacherQuestionController::class, 'destroyBank'])->name('question-banks.destroy');

        Route::get('exams', [TeacherExamController::class, 'index'])->name('exams.index');
        Route::post('exams', [TeacherExamController::class, 'store'])->name('exams.store');
        Route::get('exams/{exam}/edit', [TeacherExamController::class, 'edit'])->name('exams.edit');
        Route::get('exams/{exam}/grading', [TeacherExamController::class, 'grading'])->name('exams.grading');
        Route::post('exams/{exam}/sessions/{session}/grade', [TeacherExamController::class, 'grade'])->name('exams.grade');
        Route::post('exams/{exam}/sessions/{session}/unlock', [TeacherExamController::class, 'unlockSession'])->name('exams.unlock-session');
        Route::get('exams/{exam}/monitor', [TeacherExamController::class, 'monitor'])->name('exams.monitor');
        Route::get('exams/{exam}/sessions/{session}', [TeacherExamController::class, 'monitorSession'])->name('exams.monitor-session');
        Route::put('exams/{exam}', [TeacherExamController::class, 'update'])->name('exams.update');
        Route::get('exams/{exam}', [TeacherExamController::class, 'show'])->name('exams.show');
        Route::delete('exams/{exam}', [TeacherExamController::class, 'destroy'])->name('exams.destroy');
        Route::patch('exams/{exam}/publish', [TeacherExamController::class, 'publish'])->name('exams.publish');
        Route::patch('exams/{exam}/unpublish', [TeacherExamController::class, 'unpublish'])->name('exams.unpublish');
        Route::get('exams/{exam}/results', [TeacherExamController::class, 'results'])->name('exams.results');
        Route::get('exams/{exam}/results/export', [TeacherExamController::class, 'exportResults'])->name('exams.results-export');

        // Preview / uji coba routes
        Route::get('exams/{exam}/preview/start', [TeacherExamPreviewController::class, 'start'])->name('exams.preview.start');
        Route::get('exams/{exam}/preview/{session}/work', [TeacherExamPreviewController::class, 'work'])->name('exams.preview.work');
        Route::post('exams/{exam}/preview/{session}/answers', [TeacherExamPreviewController::class, 'saveAnswer'])->name('exams.preview.answer');
        Route::post('exams/{exam}/preview/{session}/submit', [TeacherExamPreviewController::class, 'submit'])->name('exams.preview.submit');
        Route::get('exams/{exam}/preview/{session}/result', [TeacherExamPreviewController::class, 'result'])->name('exams.preview.result');
    });

Route::middleware(['auth', 'verified', 'role:siswa'])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::get('exams', [StudentExamController::class, 'index'])->name('exams.index');
        Route::post('exams/{exam}/start', [StudentExamController::class, 'start'])->name('exams.start');
        Route::get('results', [StudentExamController::class, 'history'])->name('results.index');
        Route::get('sessions/{session}/work', [StudentExamController::class, 'work'])->name('exams.work');
        Route::get('sessions/{session}/result', [StudentExamController::class, 'result'])->name('exams.result');
        Route::post('sessions/{session}/submit', [StudentExamController::class, 'submit'])->name('exams.submit');
        Route::post('sessions/{session}/answers', [StudentExamController::class, 'saveAnswer'])->name('exams.answer');
        Route::post('sessions/{session}/security-events', [StudentExamController::class, 'securityEvent'])->name('exams.security');
    });

require __DIR__.'/settings.php';
