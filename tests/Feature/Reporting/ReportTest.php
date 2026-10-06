<?php

use App\Models\Answer;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Services\ExamScorer;

function reportFixture(bool $showImmediately = true): array
{
    $guruUser = User::factory()->guru()->create();
    $teacher = Teacher::query()->create(['user_id' => $guruUser->id, 'full_name' => 'Pak Nilai']);
    $subject = Subject::query()->create(['code' => 'MTP-'.mt_rand(1000, 9999), 'name' => 'Matematika Terapan', 'is_active' => true]);
    $bank = QuestionBank::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'name' => 'Bank Nilai']);
    $class = SchoolClass::query()->create(['name' => '9A-'.mt_rand(1000, 9999), 'academic_year' => '2026/2027']);

    $mc = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'multiple_choice', 'content' => '5 x 6?', 'weight' => 2]);
    $mc->options()->createMany([
        ['label' => 'A', 'content' => '30', 'is_correct' => true],
        ['label' => 'B', 'content' => '25'],
        ['label' => 'C', 'content' => '35'],
        ['label' => 'D', 'content' => '56'],
    ]);

    $exam = Exam::query()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'school_class_id' => $class->id,
        'name' => 'Ujian Report',
        'started_at' => now()->subHour(),
        'duration_minutes' => 60,
        'is_published' => true,
        'published_at' => now()->subDay(),
        'show_result_immediately' => $showImmediately,
    ]);
    $exam->questions()->sync([$mc->id => ['sort_order' => 1]]);

    $siswaUser = User::factory()->siswa()->create();
    $student = Student::query()->create(['user_id' => $siswaUser->id, 'full_name' => 'Bella', 'nis' => (string) mt_rand(100000, 999999)]);
    $class->students()->sync([$student->id]);

    $session = ExamSession::query()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'started_at' => now()->subMinutes(30),
        'submitted_at' => now()->subMinutes(5),
        'status' => 'submitted',
        'random_seed' => 5,
        'question_order' => [$mc->id],
    ]);
    Answer::query()->create(['exam_session_id' => $session->id, 'question_id' => $mc->id, 'value' => ['option_id' => $mc->options()->where('is_correct', true)->first()->id]]);
    app(ExamScorer::class)->score($session);

    return [$exam, $session, $siswaUser, $student, $guruUser, $class];
}

test('guru can view the exam score report with statistics', function () {
    [$exam, $session, , , $guruUser] = reportFixture();

    $this->actingAs($guruUser)
        ->get(route('teacher.exams.results', $exam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teacher/exams/results')
            ->where('stats.submitted', 1)
            ->where('stats.average', 100)
            ->where('rows.0.student_name', 'Bella')
            ->where('rows.0.score', 100)
            ->has('questionStats.0', fn ($stat) => $stat
                ->where('content', '5 x 6?')
                ->where('correct_count', 1)
                ->etc()));
});

test('guru can not view another teacher\'s score report', function () {
    [$exam] = reportFixture();

    $otherGuru = User::factory()->guru()->create();
    Teacher::query()->create(['user_id' => $otherGuru->id, 'full_name' => 'Guru Lain']);

    $this->actingAs($otherGuru)->get(route('teacher.exams.results', $exam))->assertForbidden();
});

test('guru can export the score report as csv', function () {
    [$exam, $session, , , $guruUser] = reportFixture();

    $response = $this->actingAs($guruUser)->get(route('teacher.exams.results-export', $exam));

    $response->assertOk();
    $content = $response->streamedContent();
    expect(str_contains($content, 'Nama Siswa'))->toBeTrue();
    expect(str_contains($content, 'Bella'))->toBeTrue();
});

test('admin can view the school-wide report page', function () {
    [$exam] = reportFixture();

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)
        ->get(route('admin.reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/index')
            ->where('rows.0.name', 'Ujian Report')
            ->where('rows.0.average', 100));

    $this->actingAs(User::factory()->guru()->create())->get(route('admin.reports.index'))->assertForbidden();
});
