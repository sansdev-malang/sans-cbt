<?php

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Result;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Services\ExamScorer;

function gradingFixture(): array
{
    $guruUser = User::factory()->guru()->create();
    $teacher = Teacher::query()->create(['user_id' => $guruUser->id, 'full_name' => 'Pak Guru']);
    $subject = Subject::query()->create(['code' => 'IPA', 'name' => 'IPA', 'is_active' => true]);
    $bank = QuestionBank::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'name' => 'Bank IPA']);
    $class = SchoolClass::query()->create(['name' => '7A', 'academic_year' => '2026/2027']);

    $mc = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'multiple_choice', 'content' => 'Air mendidih pada suhu?', 'weight' => 2]);
    $mc->options()->createMany([
        ['label' => 'A', 'content' => '50 C'],
        ['label' => 'B', 'content' => '100 C', 'is_correct' => true],
        ['label' => 'C', 'content' => '80 C'],
        ['label' => 'D', 'content' => '120 C'],
    ]);
    $essay = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'essay', 'content' => 'Jelaskan siklus air!', 'weight' => 10]);

    $exam = Exam::query()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'school_class_id' => $class->id,
        'name' => 'Ujian IPA',
        'started_at' => now()->subHour(),
        'duration_minutes' => 60,
        'is_published' => true,
        'published_at' => now()->subDay(),
        'show_result_immediately' => true,
    ]);
    $exam->questions()->sync([$mc->id => ['sort_order' => 1], $essay->id => ['sort_order' => 2]]);

    $siswaUser = User::factory()->siswa()->create();
    $student = Student::query()->create(['user_id' => $siswaUser->id, 'full_name' => 'Siti', 'nis' => '3001']);
    $class->students()->sync([$student->id]);

    $session = ExamSession::query()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'started_at' => now()->subMinutes(50),
        'submitted_at' => now()->subMinutes(10),
        'status' => 'submitted',
        'random_seed' => 7,
        'question_order' => [$mc->id, $essay->id],
    ]);

    // MC answered correctly, essay text submitted but ungraded
    \App\Models\Answer::query()->create(['exam_session_id' => $session->id, 'question_id' => $mc->id, 'value' => ['option_id' => $mc->options()->where('is_correct', true)->first()->id]]);
    \App\Models\Answer::query()->create(['exam_session_id' => $session->id, 'question_id' => $essay->id, 'value' => ['text' => 'Air menguap, mengembun, lalu turun sebagai hujan.']]);
    $session->update(['status' => 'submitted']);
    app(ExamScorer::class)->score($session);

    return [$exam, $session, $essay, $siswaUser, $guruUser, $teacher];
}

test('guru can view the essay grading page with pending essays', function () {
    [$exam, , , , $guruUser] = gradingFixture();

    $this->actingAs($guruUser)
        ->get(route('teacher.exams.grading', $exam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teacher/exams/grading')
            ->where('sessions.0.student_name', 'Siti')
            ->where('sessions.0.pending_essays', 1)
            ->where('sessions.0.essays.0.student_text', 'Air menguap, mengembun, lalu turun sebagai hujan.'));
});

test('guru can grade an essay and the final score is recomputed', function () {
    [$exam, $session, $essay, , $guruUser] = gradingFixture();

    $result = Result::query()->where('exam_session_id', $session->id)->first();
    expect($result->score)->toBeNull();
    expect($result->has_essay_pending)->toBeTrue();

    $this->actingAs($guruUser)
        ->post(route('teacher.exams.grade', ['exam' => $exam->id, 'session' => $session->id]), [
            'scores' => [$essay->id => 8],
        ])
        ->assertRedirect();

    $result = $result->fresh();
    expect($result->earned_score)->toBe(10.0); // 2 (MC benar) + 8 (esai)
    expect($result->score)->toBe(83.33); // 10/12 * 100
    expect($result->has_essay_pending)->toBeFalse();

    $detail = $result->details()->where('question_id', $essay->id)->first();
    expect($detail->earned)->toBe(8.0);
    expect($detail->graded_at)->not->toBeNull();
});

test('essay scores above the weight are capped', function () {
    [$exam, $session, $essay] = gradingFixture();
    $guruUser = User::whereHas('teacher')->first();

    $this->actingAs($guruUser)
        ->post(route('teacher.exams.grade', ['exam' => $exam->id, 'session' => $session->id]), [
            'scores' => [$essay->id => 999],
        ])
        ->assertRedirect();

    $detail = Result::query()->where('exam_session_id', $session->id)->first()->details()->where('question_id', $essay->id)->first();
    expect($detail->earned)->toBe(10.0);
});

test('guru can not grade another teacher\'s session', function () {
    [$exam, $session, $essay] = gradingFixture();

    $otherGuru = User::factory()->guru()->create();
    Teacher::query()->create(['user_id' => $otherGuru->id, 'full_name' => 'Guru Lain']);

    $this->actingAs($otherGuru)
        ->post(route('teacher.exams.grade', ['exam' => $exam->id, 'session' => $session->id]), [
            'scores' => [$essay->id => 5],
        ])
        ->assertForbidden();
});

test('guru can monitor participant progress', function () {
    [$exam, , , , $guruUser] = gradingFixture();

    $this->actingAs($guruUser)
        ->get(route('teacher.exams.monitor', $exam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teacher/exams/monitor')
            ->where('exam.participants_count', 1)
            ->where('sessions.0.student_name', 'Siti')
            ->where('sessions.0.status', 'submitted')
            ->where('sessions.0.answered_count', 2)
            ->where('sessions.0.questions_count', 2));
});

test('guru can view detailed session surveillance with answer summaries', function () {
    [$exam, $session, , , $guruUser] = gradingFixture();

    $this->actingAs($guruUser)
        ->get(route('teacher.exams.monitor-session', ['exam' => $exam->id, 'session' => $session->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teacher/exams/monitor-detail')
            ->where('session.student_name', 'Siti')
            ->where('session.questions.0.summary', '100 C')
            ->where('session.questions.0.answered', true)
            ->where('session.questions.1.summary', 'Air menguap, mengembun, lalu turun sebagai hujan.')
            ->has('session.logs'));
});

test('guru can not view another teacher\'s session detail', function () {
    [$exam, $session] = gradingFixture();

    $otherGuru = User::factory()->guru()->create();
    Teacher::query()->create(['user_id' => $otherGuru->id, 'full_name' => 'Guru Lain']);

    $this->actingAs($otherGuru)
        ->get(route('teacher.exams.monitor-session', ['exam' => $exam->id, 'session' => $session->id]))
        ->assertForbidden();
});

test('guru can not monitor another teacher\'s exam', function () {
    [$exam, , , , $guruUser] = gradingFixture();

    $otherGuru = User::factory()->guru()->create();
    Teacher::query()->create(['user_id' => $otherGuru->id, 'full_name' => 'Guru Lain']);

    $this->actingAs($otherGuru)->get(route('teacher.exams.monitor', $exam))->assertForbidden();
    $this->actingAs($guruUser)->get(route('teacher.exams.monitor', $exam))->assertOk();
});
