<?php

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

function securityFixture(): array
{
    $guruUser = User::factory()->guru()->create();
    $teacher = Teacher::query()->create(['user_id' => $guruUser->id, 'full_name' => 'Pak Pengawas']);
    $subject = Subject::query()->create(['code' => 'PKN-'.mt_rand(1000, 9999), 'name' => 'PKN', 'is_active' => true]);
    $bank = QuestionBank::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'name' => 'Bank PKN']);
    $class = SchoolClass::query()->create(['name' => '8A-'.mt_rand(1000, 9999), 'academic_year' => '2026/2027']);

    $mc = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'multiple_choice', 'content' => 'Pancasila dasar negara?', 'weight' => 1]);
    $mc->options()->createMany([
        ['label' => 'A', 'content' => 'Ya'],
        ['label' => 'B', 'content' => 'Tentu'],
        ['label' => 'C', 'content' => 'Benar'],
        ['label' => 'D', 'content' => 'Pancasila', 'is_correct' => true],
    ]);

    $exam = Exam::query()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'school_class_id' => $class->id,
        'name' => 'Ujian PKN',
        'started_at' => now()->subMinutes(5),
        'duration_minutes' => 60,
        'is_published' => true,
        'published_at' => now()->subDay(),
    ]);
    $exam->questions()->sync([$mc->id => ['sort_order' => 1]]);

    $siswaUser = User::factory()->siswa()->create();
    $student = Student::query()->create(['user_id' => $siswaUser->id, 'full_name' => 'Hana', 'nis' => (string) mt_rand(100000, 999999)]);
    $class->students()->sync([$student->id]);

    $session = ExamSession::query()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'started_at' => now()->subMinutes(2),
        'status' => 'ongoing',
        'random_seed' => 11,
        'question_order' => [$mc->id],
    ]);

    return [$exam, $session, $siswaUser, $mc];
}

test('login and logout are recorded in the audit trail', function () {
    $user = User::factory()->siswa()->create();

    // A real login request fires the Login event; actingAs() does not.
    $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect();
    expect(AuditLog::query()->where('event_type', 'LOGIN')->where('user_id', $user->id)->exists())->toBeTrue();

    $this->post(route('logout'));
    expect(AuditLog::query()->where('event_type', 'LOGOUT')->where('user_id', $user->id)->exists())->toBeTrue();
});

test('starting an exam records START_EXAM', function () {
    [$exam, , $siswaUser] = securityFixture();
    // the fixture pre-creates an ongoing session; remove it so start() creates a fresh one
    ExamSession::query()->delete();

    $this->actingAs($siswaUser)->post(route('student.exams.start', $exam))->assertRedirect();

    expect(AuditLog::query()->where('event_type', 'START_EXAM')->where('level', 'info')->exists())->toBeTrue();
});

test('autosave records ANSWER_SAVED', function () {
    [$exam, $session, $siswaUser, $mc] = securityFixture();

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.answer', $session), ['question_id' => $mc->id, 'value' => ['option_id' => 1]])
        ->assertOk();

    expect(AuditLog::query()->where('event_type', 'ANSWER_SAVED')->where('exam_session_id', $session->id)->exists())->toBeTrue();
});

test('the client can report security events with server-side levels', function () {
    [$exam, $session, $siswaUser] = securityFixture();

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.security', $session), ['type' => 'WINDOW_BLUR'])
        ->assertOk()
        ->assertJson(['ok' => true, 'recorded' => true]);

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.security', $session), ['type' => 'FULLSCREEN_EXIT'])
        ->assertOk();

    expect(AuditLog::query()->where('event_type', 'WINDOW_BLUR')->where('level', 'warning')->where('exam_session_id', $session->id)->exists())->toBeTrue();
    expect(AuditLog::query()->where('event_type', 'FULLSCREEN_EXIT')->where('level', 'violation')->exists())->toBeTrue();
});

test('unknown security event types are not recorded', function () {
    [$exam, $session, $siswaUser] = securityFixture();

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.security', $session), ['type' => 'HACK_ATTEMPT'])
        ->assertOk()
        ->assertJson(['ok' => true, 'recorded' => false]);

    expect(AuditLog::query()->where('exam_session_id', $session->id)->count())->toBe(0);
});

test('other students can not report security events for a foreign session', function () {
    [$exam, $session] = securityFixture();

    $otherUser = User::factory()->siswa()->create();
    Student::query()->create(['user_id' => $otherUser->id, 'full_name' => 'Penyusup', 'nis' => '4002']);

    $this->actingAs($otherUser)
        ->postJson(route('student.exams.security', $session), ['type' => 'WINDOW_BLUR'])
        ->assertForbidden();

    expect(AuditLog::query()->count())->toBe(0);
});

test('submitting records SUBMIT_EXAM and expiry records TIME_EXPIRED', function () {
    [$exam, $session, $siswaUser] = securityFixture();

    $this->actingAs($siswaUser)->post(route('student.exams.submit', $session))->assertRedirect();
    expect(AuditLog::query()->where('event_type', 'SUBMIT_EXAM')->where('exam_session_id', $session->id)->exists())->toBeTrue();

    // a second session that runs past its deadline
    [$exam2, $session2, $siswaUser2] = securityFixture();
    $session2->update(['started_at' => now()->subMinutes(90)]);

    $this->actingAs($siswaUser2)->get(route('student.exams.work', $session2))->assertRedirect();
    expect(AuditLog::query()->where('event_type', 'TIME_EXPIRED')->where('exam_session_id', $session2->id)->where('level', 'warning')->exists())->toBeTrue();
});

test('admin can browse the audit log with filters', function () {
    [$exam, $session, $siswaUser] = securityFixture();
    $this->actingAs($siswaUser)->postJson(route('student.exams.security', $session), ['type' => 'WINDOW_BLUR'])->assertOk();

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)
        ->get(route('admin.audit-logs.index', ['level' => 'warning']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/audit-logs/index')
            ->where('filters.level', 'warning')
            ->has('logs.data.0', fn ($log) => $log
                ->where('event_type', 'WINDOW_BLUR')
                ->where('level', 'warning')
                ->etc()));

    $this->actingAs(User::factory()->guru()->create())->get(route('admin.audit-logs.index'))->assertForbidden();
});

test('admin monitoring shows ongoing sessions and violations', function () {
    [$exam, $session, $siswaUser] = securityFixture();
    $this->actingAs($siswaUser)->postJson(route('student.exams.security', $session), ['type' => 'FULLSCREEN_EXIT'])->assertOk();

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)
        ->get(route('admin.exam-monitoring.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-monitoring/index')
            ->where('ongoing.0.id', $session->id)
            ->where('ongoing.0.violations_count', 1)
            ->has('recentViolations', 1, fn ($row) => $row->where('event_type', 'FULLSCREEN_EXIT')->etc()));
});

test('teacher monitor payload exposes violation counters', function () {
    [$exam, $session, $siswaUser] = securityFixture();
    $this->actingAs($siswaUser)->postJson(route('student.exams.security', $session), ['type' => 'WINDOW_BLUR'])->assertOk();
    $this->actingAs($siswaUser)->postJson(route('student.exams.security', $session), ['type' => 'FULLSCREEN_EXIT'])->assertOk();

    $guruUser = User::whereHas('teacher')->first();
    $this->actingAs($guruUser)
        ->get(route('teacher.exams.monitor', $exam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sessions.0.warnings_count', 1)
            ->where('sessions.0.violations_count', 1)
            ->where('sessions.0.last_violation_label', 'FULLSCREEN_EXIT'));
});

test('copy and paste attempts are recorded as warnings', function () {
    [$exam, $session, $siswaUser] = securityFixture();

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.security', $session), ['type' => 'COPY_ATTEMPT'])
        ->assertOk()
        ->assertJson(['ok' => true, 'recorded' => true]);

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.security', $session), ['type' => 'PASTE_BLOCKED', 'metadata' => ['target' => 'essay']])
        ->assertOk()
        ->assertJson(['ok' => true, 'recorded' => true]);

    expect(AuditLog::query()->where('event_type', 'COPY_ATTEMPT')->where('level', 'warning')->where('exam_session_id', $session->id)->exists())->toBeTrue();
    expect(AuditLog::query()->where('event_type', 'PASTE_BLOCKED')->where('level', 'warning')->exists())->toBeTrue();
});

test('repeated violations report a running count that locks and flags the session', function () {
    [$exam, $session, $siswaUser] = securityFixture();

    foreach ([1, 2, 3] as $expectedCount) {
        $this->actingAs($siswaUser)
            ->postJson(route('student.exams.security', $session), ['type' => 'FULLSCREEN_EXIT'])
            ->assertOk()
            ->assertJson(['ok' => true, 'recorded' => true, 'violation_count' => $expectedCount, 'locked' => $expectedCount >= 3]);
    }

    expect($session->fresh()->isLocked())->toBeTrue();

    $guruUser = User::whereHas('teacher')->first();
    $this->actingAs($guruUser)
        ->get(route('teacher.exams.monitor', $exam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sessions.0.violations_count', 3)
            ->where('sessions.0.flagged', true)
            ->where('sessions.0.locked', true));
});

test('sessions below the violation threshold are not flagged', function () {
    [$exam, $session, $siswaUser] = securityFixture();

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.security', $session), ['type' => 'FULLSCREEN_EXIT'])
        ->assertOk()
        ->assertJson(['violation_count' => 1]);

    $guruUser = User::whereHas('teacher')->first();
    $this->actingAs($guruUser)
        ->get(route('teacher.exams.monitor', $exam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sessions.0.violations_count', 1)
            ->where('sessions.0.flagged', false));
});

test('the exam work page tells the client the violation flag threshold', function () {
    [$exam, $session, $siswaUser] = securityFixture();

    $this->actingAs($siswaUser)
        ->get(route('student.exams.work', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('student/exams/work')
            ->where('session.violation_flag_threshold', 3));
});
