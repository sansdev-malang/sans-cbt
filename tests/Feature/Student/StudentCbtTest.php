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
use Illuminate\Support\Carbon;

function cbtFixture(): array
{
    $guruUser = User::factory()->guru()->create();
    $teacher = Teacher::query()->create(['user_id' => $guruUser->id, 'full_name' => 'Pak Budi']);
    $subject = Subject::query()->create(['code' => 'MTK', 'name' => 'Matematika', 'is_active' => true]);
    $bank = QuestionBank::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'name' => 'Bank CBT']);
    $class = SchoolClass::query()->create(['name' => '5A', 'academic_year' => '2026/2027']);

    $mc = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'multiple_choice', 'content' => '2+2?', 'weight' => 2]);
    $mc->options()->createMany([
        ['label' => 'A', 'content' => '3'],
        ['label' => 'B', 'content' => '4', 'is_correct' => true],
        ['label' => 'C', 'content' => '5'],
        ['label' => 'D', 'content' => '6'],
    ]);

    $complex = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'multiple_answers', 'content' => 'Bilangan genap?', 'weight' => 4]);
    $complex->options()->createMany([
        ['label' => 'A', 'content' => '2', 'is_correct' => true],
        ['label' => 'B', 'content' => '3'],
        ['label' => 'C', 'content' => '8', 'is_correct' => true],
        ['label' => 'D', 'content' => '9'],
    ]);

    $statements = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'statement_true_false', 'content' => 'Nilailah!', 'weight' => 2]);
    $statements->options()->createMany([
        ['label' => 'A', 'content' => '5 > 3', 'is_correct' => true],
        ['label' => 'B', 'content' => '1 > 3', 'is_correct' => false],
    ]);

    $matching = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'matching', 'content' => 'Jodohkan!', 'weight' => 2]);
    $matching->pairs()->createMany([
        ['left_text' => '1/2', 'right_text' => '0,5', 'sort_order' => 1],
        ['left_text' => '1/4', 'right_text' => '0,25', 'sort_order' => 2],
    ]);

    $essay = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'essay', 'content' => 'Jelaskan pecahan!', 'weight' => 10]);

    $exam = Exam::query()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'school_class_id' => $class->id,
        'name' => 'UTS Matematika',
        'started_at' => now()->subMinutes(10),
        'duration_minutes' => 60,
        'shuffle_questions' => true,
        'show_result_immediately' => true,
        'is_published' => true,
        'published_at' => now()->subDay(),
    ]);
    $exam->questions()->sync(collect([$mc, $complex, $statements, $matching, $essay])->mapWithKeys(fn ($q, $i) => [$q->id => ['sort_order' => $i + 1]]));

    $parentUser = User::factory()->create();
    $siswaUser = User::factory()->siswa()->create();
    $student = Student::query()->create(['user_id' => $siswaUser->id, 'full_name' => 'Siti', 'nis' => '2001']);
    $class->students()->sync([$student->id]);

    return [$exam, $student, $siswaUser, $mc, $complex, $statements, $matching, $essay];
}

function ongoingSession(Exam $exam, Student $student, int $startedMinutesAgo = 5): ExamSession
{
    return ExamSession::query()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'started_at' => now()->subMinutes($startedMinutesAgo),
        'status' => 'ongoing',
        'random_seed' => 42,
        'question_order' => $exam->questions()->orderBy('exam_questions.sort_order')->pluck('questions.id')->all(),
    ]);
}

test('guests are redirected from the student area', function () {
    $this->get(route('student.exams.index'))->assertRedirect(route('login'));
});

test('teachers can not access the student exam area', function () {
    $this->actingAs(User::factory()->guru()->create())
        ->get(route('student.exams.index'))
        ->assertForbidden();
});

test('siswa sees published exams for their class', function () {
    [$exam, , $siswaUser] = cbtFixture();

    $this->actingAs($siswaUser)
        ->get(route('student.exams.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('student/exams/index')
            ->where('exams.0.id', $exam->id)
            ->where('exams.0.status', 'ongoing'));
});

test('siswa can start an ongoing exam and gets a session with shuffled order', function () {
    [$exam, $student, $siswaUser] = cbtFixture();

    $this->actingAs($siswaUser)->post(route('student.exams.start', $exam))->assertRedirect();

    $session = ExamSession::query()->where('student_id', $student->id)->first();
    expect($session)->not->toBeNull();
    expect($session->question_order)->toHaveCount(5);

    $this->actingAs($siswaUser)
        ->get(route('student.exams.work', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('student/exams/work')
            ->has('questions', 5)
            ->has('session.deadline')
            ->has('session.server_time'));
});

test('the work page never leaks answer keys', function () {
    [$exam, $student, $siswaUser, $mc] = cbtFixture();
    $session = ongoingSession($exam, $student);

    $response = $this->actingAs($siswaUser)->get(route('student.exams.work', $session));
    $response->assertOk();

    $content = $response->getContent() ?? '';
    expect(str_contains($content, 'is_correct'))->toBeFalse();
    expect(str_contains($content, 'isCorrect'))->toBeFalse();
    // sanity: the correct option id exists in the data but must not be marked as key
    expect($mc->options()->where('is_correct', true)->value('id'))->not->toBeNull();
});

test('answers autosave during an ongoing session', function () {
    [$exam, $student, $siswaUser, $mc] = cbtFixture();
    $session = ongoingSession($exam, $student);
    $correctOption = $mc->options()->where('is_correct', true)->first();

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.answer', $session), [
            'question_id' => $mc->id,
            'value' => ['option_id' => $correctOption->id],
        ])
        ->assertOk()
        ->assertJson(['ok' => true]);

    $this->assertDatabaseHas('answers', ['exam_session_id' => $session->id, 'question_id' => $mc->id]);
});

test('answers outside the exam are rejected', function () {
    [$exam, $student, $siswaUser, $mc] = cbtFixture();
    $session = ongoingSession($exam, $student);

    $foreign = Question::query()->create(['question_bank_id' => $exam->questions()->first()->question_bank_id, 'type' => 'essay', 'content' => 'Soal lain', 'weight' => 1]);

    $this->actingAs($siswaUser)
        ->postJson(route('student.exams.answer', $session), ['question_id' => $foreign->id, 'value' => ['text' => 'x']])
        ->assertStatus(422);
});

test('submitting scores every objective question type automatically', function () {
    [$exam, $student, $siswaUser, $mc, $complex, $statements, $matching] = cbtFixture();
    $session = ongoingSession($exam, $student);

    // MC correct (2), complex one-wrong (0), statements half right (1), matching correct (2), essay unscored (0)
    $payloads = [
        $mc->id => ['option_id' => $mc->options()->where('is_correct', true)->first()->id],
        $complex->id => ['option_ids' => [$complex->options()->where('is_correct', true)->first()->id]],
        $statements->id => ['judgments' => [$statements->options()->first()->id => true]],
        $matching->id => ['matches' => $matching->pairs->pluck('right_text', 'id')->all()],
    ];
    foreach ($payloads as $questionId => $value) {
        Answer::query()->create(['exam_session_id' => $session->id, 'question_id' => $questionId, 'value' => $value]);
    }

    $this->actingAs($siswaUser)->post(route('student.exams.submit', $session))->assertRedirect();

    $result = Result::query()->where('exam_session_id', $session->id)->first();
    expect($result)->not->toBeNull();
    expect($result->max_score)->toBe(20.0);
    // earned: 2 (MC) + 0 (complex incomplete) + 1 (half statements) + 2 (matching) + 0 (essay) = 5
    expect($result->earned_score)->toBe(5.0);
    // total stays null while the essay awaits manual grading
    expect($result->score)->toBeNull();
    expect($result->has_essay_pending)->toBeTrue();
    expect($session->fresh()->status)->toBe('submitted');
});

test('an expired session is finalized and shows the result', function () {
    [$exam, $student, $siswaUser] = cbtFixture();
    // started 70 minutes ago on a 60 minute exam
    $session = ongoingSession($exam, $student, 70);

    $this->actingAs($siswaUser)->get(route('student.exams.work', $session))->assertRedirect();

    expect($session->fresh()->status)->toBe('expired');
    expect(Result::query()->where('exam_session_id', $session->id)->exists())->toBeTrue();

    $this->actingAs($siswaUser)
        ->get(route('student.exams.result', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('student/exams/result'));
});

test('starting an exam before its schedule is blocked', function () {
    [$exam, , $siswaUser] = cbtFixture();
    $exam->update(['started_at' => now()->addDay()]);

    $this->actingAs($siswaUser)
        ->post(route('student.exams.start', $exam), [])
        ->assertRedirect();

    expect(ExamSession::query()->count())->toBe(0);
});

test('students from another class can not start the exam', function () {
    [$exam, , $siswaUser] = cbtFixture();

    $otherUser = User::factory()->siswa()->create();
    $otherStudent = Student::query()->create(['user_id' => $otherUser->id, 'full_name' => 'Budi', 'nis' => '2002']);

    $this->actingAs($otherUser)->post(route('student.exams.start', $exam))->assertRedirect();
    expect(ExamSession::query()->count())->toBe(0);
});

test('exam results stay hidden unless the exam shows them immediately', function () {
    [$exam, $student, $siswaUser] = cbtFixture();
    $session = ongoingSession($exam, $student);
    $session->update(['status' => 'submitted', 'submitted_at' => now()]);
    $session->exam->update(['show_result_immediately' => false]);

    $this->actingAs($siswaUser)
        ->get(route('student.exams.result', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('student/exams/result')
            ->where('show_score', false)
            ->has('result'));
});

test('riwayat nilai lists finished sessions', function () {
    [$exam, $student, $siswaUser] = cbtFixture();
    $session = ongoingSession($exam, $student);
    $session->update(['status' => 'submitted', 'submitted_at' => now()]);

    $this->actingAs($siswaUser)
        ->get(route('student.results.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('student/results/index')
            ->where('results.0.exam_name', 'UTS Matematika'));
});
