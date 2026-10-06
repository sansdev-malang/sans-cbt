<?php

use App\Models\Answer;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Services\ExamAuditLogger;

function lockFixture(): array
{
    $guruUser = User::factory()->guru()->create();
    $teacher = Teacher::query()->create(['user_id' => $guruUser->id, 'full_name' => 'Pak Pengawas']);
    $subject = Subject::query()->create(['code' => 'LCK-'.mt_rand(1000, 9999), 'name' => 'Ujian Terkunci', 'is_active' => true]);
    $bank = QuestionBank::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'name' => 'Bank Kunci']);
    $class = SchoolClass::query()->create(['name' => 'LK-'.mt_rand(1000, 9999), 'academic_year' => '2026/2027']);

    $mc = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'multiple_choice', 'content' => 'Kunci jawaban?', 'weight' => 2]);
    $mc->options()->createMany([
        ['label' => 'A', 'content' => 'Ya'],
        ['label' => 'B', 'content' => 'Tidak', 'is_correct' => true],
        ['label' => 'C', 'content' => 'Mungkin'],
        ['label' => 'D', 'content' => 'Tidak tahu'],
    ]);

    $exam = Exam::query()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'school_class_id' => $class->id,
        'name' => 'Ujian Anti Kecurangan',
        'started_at' => now()->subMinutes(5),
        'duration_minutes' => 60,
        'is_published' => true,
        'published_at' => now()->subDay(),
    ]);
    $exam->questions()->sync([$mc->id => ['sort_order' => 1]]);

    $siswaUser = User::factory()->siswa()->create();
    $student = Student::query()->create(['user_id' => $siswaUser->id, 'full_name' => 'Nakal', 'nis' => (string) mt_rand(100000, 999999)]);
    $class->students()->sync([$student->id]);

    $session = ExamSession::query()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'started_at' => now()->subMinutes(2),
        'status' => 'ongoing',
        'random_seed' => 77,
        'question_order' => [$mc->id],
    ]);

    return [$exam, $session, $siswaUser, $mc, $guruUser];
}

test('a session locks automatically after repeated violations', function () {
    [$exam, $session, $siswaUser] = lockFixture();

    foreach (range(1, ExamAuditLogger::VIOLATION_FLAG_THRESHOLD) as $i) {
        $this->actingAs($siswaUser)
            ->postJson(route('student.exams.security', $session), ['type' => 'FULLSCREEN_EXIT'])
            ->assertOk();
    }

    expect($session->fresh()->isLocked())->toBeTrue();
    expect($session->fresh()->locked_reason)->toContain('pelanggaran');
    expect(AuditLog::query()->where('event_type', 'SESSION_LOCKED')->where('level', 'critical')->exists())->toBeTrue();
});

test('warnings alone never lock a session', function () {
    [$exam, $session, $siswaUser] = lockFixture();

    foreach (range(1, 10) as $i) {
        $this->actingAs($siswaUser)
            ->postJson(route('student.exams.security', $session), ['type' => 'WINDOW_BLUR'])
            ->assertOk()
            ->assertJson(['locked' => false]);
    }

    expect($session->fresh()->isLocked())->toBeFalse();
});

test('locked sessions reject autosave and show the lock on the work page', function () {
    [$exam, $session, $siswaUser, $mc] = lockFixture();
    app(ExamAuditLogger::class)->lock($session, 'Uji kunci.');

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.answer', $session), ['question_id' => $mc->id, 'value' => ['option_id' => 1]])
        ->assertStatus(409)
        ->assertJson(['ok' => false, 'reason' => 'locked']);

    $this->actingAs($siswaUser)
        ->get(route('student.exams.work', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('student/exams/work')
            ->where('session.locked', true)
            ->where('session.locked_reason', 'Uji kunci.'));

    expect(Answer::query()->where('exam_session_id', $session->id)->count())->toBe(0);
});

test('only the exam owner can unlock a locked session', function () {
    [$exam, $session, $siswaUser, , $guruUser] = lockFixture();
    app(ExamAuditLogger::class)->lock($session, 'Uji kunci.');

    $otherGuru = User::factory()->guru()->create();
    Teacher::query()->create(['user_id' => $otherGuru->id, 'full_name' => 'Guru Lain']);

    $this->actingAs($otherGuru)
        ->post(route('teacher.exams.unlock-session', ['exam' => $exam->id, 'session' => $session->id]))
        ->assertForbidden();

    expect($session->fresh()->isLocked())->toBeTrue();

    $this->actingAs($guruUser)
        ->post(route('teacher.exams.unlock-session', ['exam' => $exam->id, 'session' => $session->id]))
        ->assertRedirect();

    expect($session->fresh()->isLocked())->toBeFalse();
    expect($session->fresh()->locked_reason)->toBeNull();
    expect(AuditLog::query()->where('event_type', 'SESSION_UNLOCKED')->where('user_id', $guruUser->id)->exists())->toBeTrue();
});

test('answers save again after the teacher unlocks the session', function () {
    [$exam, $session, $siswaUser, $mc, $guruUser] = lockFixture();
    app(ExamAuditLogger::class)->lock($session, 'Uji kunci.');

    $this->actingAs($guruUser)
        ->post(route('teacher.exams.unlock-session', ['exam' => $exam->id, 'session' => $session->id]))
        ->assertRedirect();

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.answer', $session), ['question_id' => $mc->id, 'value' => ['option_id' => 1]])
        ->assertOk();

    expect(Answer::query()->where('exam_session_id', $session->id)->count())->toBe(1);
});

test('teacher monitor payloads expose the lock state', function () {
    [$exam, $session, , , $guruUser] = lockFixture();
    app(ExamAuditLogger::class)->lock($session, 'Uji kunci.');

    $this->actingAs($guruUser)
        ->get(route('teacher.exams.monitor', $exam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sessions.0.locked', true)
            ->where('sessions.0.locked_reason', 'Uji kunci.'));

    $this->actingAs($guruUser)
        ->get(route('teacher.exams.monitor-session', ['exam' => $exam->id, 'session' => $session->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('session.locked', true)
            ->where('session.locked_reason', 'Uji kunci.'));
});
