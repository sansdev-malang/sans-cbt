<?php

use App\Models\Exam;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Carbon;

function guruWithProfile(): array
{
    $user = User::factory()->guru()->create();
    $teacher = Teacher::query()->create(['user_id' => $user->id, 'full_name' => 'Pak Budi', 'nip' => '19900001']);

    return [$user, $teacher];
}

function subjectForExams(): Subject
{
    return Subject::query()->create(['code' => 'BIN', 'name' => 'Bahasa Indonesia', 'is_active' => true]);
}

function bankForTeacher(Teacher $teacher, Subject $subject): QuestionBank
{
    return QuestionBank::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'name' => 'Bank Tengah Semester', 'material' => 'Teks Narasi']);
}

function questionInBank(QuestionBank $bank, string $content = 'Soal contoh?', int $weight = 1): Question
{
    $question = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'multiple_choice', 'content' => $content, 'difficulty' => 'Mudah', 'weight' => $weight]);
    $question->options()->createMany([
        ['label' => 'A', 'content' => 'A', 'is_correct' => true],
        ['label' => 'B', 'content' => 'B', 'is_correct' => false],
        ['label' => 'C', 'content' => 'C', 'is_correct' => false],
        ['label' => 'D', 'content' => 'D', 'is_correct' => false],
    ]);

    return $question;
}

test('guests are redirected from the teacher area', function () {
    $this->get(route('teacher.dashboard'))->assertRedirect(route('login'));
});

test('admins can not access the teacher area', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('teacher.dashboard'))
        ->assertForbidden();
});

test('guru lands on the teacher dashboard', function () {
    [$user] = guruWithProfile();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect(route('teacher.dashboard'));

    $this->actingAs($user)
        ->get(route('teacher.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('teacher/dashboard'));
});

test('guru without a teacher profile gets a helpful dashboard', function () {
    $user = User::factory()->guru()->create();

    $this->actingAs($user)
        ->get(route('teacher.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('teacher/dashboard')->where('upcomingExams', []));
});

test('guru bank soal only lists banks owned by the teacher', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $ownBank = bankForTeacher($teacher, $subject);
    questionInBank($ownBank);

    $otherUser = User::factory()->guru()->create();
    $otherTeacher = Teacher::query()->create(['user_id' => $otherUser->id, 'full_name' => 'Bu Citra']);
    $otherBank = bankForTeacher($otherTeacher, $subject);

    $this->actingAs($user)
        ->get(route('teacher.questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teacher/questions/index')
            ->where('banks.0.id', $ownBank->id)
            ->missing('banks.1'));
});

test('guru can create a question bank scoped to their profile', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();

    $this->actingAs($user)
        ->post(route('teacher.question-banks.store'), ['name' => 'Bank Kuis Harian', 'subject_id' => $subject->id])
        ->assertRedirect();

    $this->assertDatabaseHas('question_banks', ['teacher_id' => $teacher->id, 'name' => 'Bank Kuis Harian']);
});

test('guru can not modify a bank owned by another teacher', function () {
    [$user] = guruWithProfile();
    $subject = subjectForExams();
    $otherUser = User::factory()->guru()->create();
    $otherTeacher = Teacher::query()->create(['user_id' => $otherUser->id, 'full_name' => 'Bu Citra']);
    $otherBank = bankForTeacher($otherTeacher, $subject);

    $this->actingAs($user)
        ->put(route('teacher.question-banks.update', $otherBank), ['name' => 'Diambil!', 'subject_id' => $subject->id])
        ->assertForbidden();

    $this->actingAs($user)
        ->delete(route('teacher.question-banks.destroy', $otherBank))
        ->assertForbidden();

    expect($otherBank->fresh()->name)->toBe('Bank Tengah Semester');
});

test('guru can create an exam from their own bank questions', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $bank = bankForTeacher($teacher, $subject);
    $questions = [
        questionInBank($bank, 'Soal satu?'),
        questionInBank($bank, 'Soal dua?'),
        questionInBank($bank, 'Soal tiga?'),
    ];
    $class = SchoolClass::query()->create(['name' => '5A', 'academic_year' => '2026/2027']);
    Student::query()->create(['full_name' => 'Ali', 'nis' => '1001']);
    Student::query()->create(['full_name' => 'Bima', 'nis' => '1002']);
    $class->students()->sync(Student::query()->pluck('id'));

    $this->actingAs($user)
        ->post(route('teacher.exams.store'), [
            'name' => 'PAT Bahasa Indonesia',
            'subject_id' => $subject->id,
            'school_class_id' => $class->id,
            'started_at' => Carbon::tomorrow()->format('Y-m-d H:i:s'),
            'duration_minutes' => 90,
            'shuffle_questions' => '1',
            'question_ids' => [$questions[0]->id, $questions[1]->id, $questions[2]->id],
        ])
        ->assertRedirect(route('teacher.exams.show', Exam::query()->first()));

    $exam = Exam::query()->first();
    expect($exam->teacher_id)->toBe($teacher->id);
    expect($exam->shuffle_questions)->toBeTrue();
    expect($exam->questions()->count())->toBe(3);
    expect($exam->is_published)->toBeFalse();
    expect($exam->status)->toBe('draft');
});

test('guru can not build an exam from another teacher\'s questions', function () {
    [$user] = guruWithProfile();
    $subject = subjectForExams();
    $otherUser = User::factory()->guru()->create();
    $otherTeacher = Teacher::query()->create(['user_id' => $otherUser->id, 'full_name' => 'Bu Citra']);
    $otherBank = bankForTeacher($otherTeacher, $subject);
    $stolen = questionInBank($otherBank, 'Soal milik guru lain');
    $class = SchoolClass::query()->create(['name' => '5B', 'academic_year' => '2026/2027']);

    $this->actingAs($user)
        ->post(route('teacher.exams.store'), [
            'name' => 'Ujian Merampok',
            'subject_id' => $subject->id,
            'school_class_id' => $class->id,
            'started_at' => Carbon::tomorrow()->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'question_ids' => [$stolen->id],
        ])
        ->assertForbidden();

    expect(Exam::query()->count())->toBe(0);
});

test('guru can not access another teacher\'s exam', function () {
    [$user] = guruWithProfile();
    $subject = subjectForExams();
    $class = SchoolClass::query()->create(['name' => '6A', 'academic_year' => '2026/2027']);
    $otherUser = User::factory()->guru()->create();
    $otherTeacher = Teacher::query()->create(['user_id' => $otherUser->id, 'full_name' => 'Bu Citra']);
    $exam = Exam::query()->create(['teacher_id' => $otherTeacher->id, 'subject_id' => $subject->id, 'school_class_id' => $class->id, 'name' => 'Ujian Orang Lain', 'started_at' => now()->addDay(), 'duration_minutes' => 60]);

    $this->actingAs($user)
        ->get(route('teacher.exams.show', $exam))
        ->assertForbidden();
});

test('publishing an exam requires at least one question', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $class = SchoolClass::query()->create(['name' => '4A', 'academic_year' => '2026/2027']);
    $exam = Exam::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'school_class_id' => $class->id, 'name' => 'Ujian Kosong', 'started_at' => now()->addDay(), 'duration_minutes' => 60]);

    $this->actingAs($user)
        ->patch(route('teacher.exams.publish', $exam))
        ->assertRedirect();

    expect($exam->fresh()->is_published)->toBeFalse();
});

test('guru can publish and unpublish an exam', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $bank = bankForTeacher($teacher, $subject);
    $question = questionInBank($bank);
    $class = SchoolClass::query()->create(['name' => '3A', 'academic_year' => '2026/2027']);
    $exam = Exam::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'school_class_id' => $class->id, 'name' => 'Kuis Harian', 'started_at' => now()->addDay(), 'duration_minutes' => 45]);
    $exam->questions()->sync([$question->id => ['sort_order' => 1]]);

    $this->actingAs($user)->patch(route('teacher.exams.publish', $exam))->assertRedirect();
    expect($exam->fresh()->is_published)->toBeTrue();
    expect($exam->fresh()->status)->toBe('scheduled');

    $this->actingAs($user)->patch(route('teacher.exams.unpublish', $exam))->assertRedirect();
    expect($exam->fresh()->is_published)->toBeFalse();
});

test('exam status follows the server clock', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $class = SchoolClass::query()->create(['name' => '2A', 'academic_year' => '2026/2027']);

    $ongoing = Exam::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'school_class_id' => $class->id, 'name' => 'Sedang Jalan', 'started_at' => now()->subMinutes(10), 'duration_minutes' => 30, 'is_published' => true, 'published_at' => now()->subDay()]);
    $finished = Exam::query()->create(['teacher_id' => $teacher->id, 'subject_id' => $subject->id, 'school_class_id' => $class->id, 'name' => 'Sudah Selesai', 'started_at' => now()->subHours(5), 'duration_minutes' => 30, 'is_published' => true, 'published_at' => now()->subDays(2)]);

    expect($ongoing->status)->toBe('ongoing');
    expect($finished->status)->toBe('finished');
});

test('guru can view their own bank detail page but not another teacher bank', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $ownBank = bankForTeacher($teacher, $subject);
    questionInBank($ownBank);

    $this->actingAs($user)
        ->get(route('teacher.question-banks.show', $ownBank))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teacher/questions/bank')
            ->where('bank.id', $ownBank->id)
            ->where('bank.questions_count', 1)
            ->where('bank.questions.0.content', 'Soal contoh?')
            ->has('subjects')
            ->has('classes'));

    $otherUser = User::factory()->guru()->create();
    $otherTeacher = Teacher::query()->create(['user_id' => $otherUser->id, 'full_name' => 'Bu Citra']);
    $otherBank = bankForTeacher($otherTeacher, $subject);

    $this->actingAs($user)
        ->get(route('teacher.question-banks.show', $otherBank))
        ->assertForbidden();
});

test('guru can update an exam keeping the same questions without duplicating pivot rows', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $bank = bankForTeacher($teacher, $subject);
    $questions = [
        questionInBank($bank, 'Soal satu?'),
        questionInBank($bank, 'Soal dua?'),
    ];
    $class = SchoolClass::query()->create(['name' => '6A', 'academic_year' => '2026/2027']);

    $exam = Exam::query()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'school_class_id' => $class->id,
        'name' => 'Ujian Awal',
        'started_at' => Carbon::tomorrow(),
        'duration_minutes' => 60,
    ]);
    $exam->questions()->sync([$questions[0]->id => ['sort_order' => 1], $questions[1]->id => ['sort_order' => 2]]);

    $this->actingAs($user)
        ->put(route('teacher.exams.update', $exam), [
            'name' => 'Ujian Revisi',
            'subject_id' => $subject->id,
            'school_class_id' => $class->id,
            'started_at' => Carbon::tomorrow()->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'question_ids' => [$questions[0]->id, $questions[1]->id],
        ])
        ->assertRedirect(route('teacher.exams.show', $exam));

    expect($exam->fresh()->name)->toBe('Ujian Revisi');
    expect($exam->questions()->count())->toBe(2);
    expect($exam->questions()->pluck('questions.id')->map(fn ($id) => (int) $id)->all())->toBe([$questions[0]->id, $questions[1]->id]);
    expect($exam->questions()->first()->pivot->sort_order)->toBe(1);
});

test('guru updating an exam can add and remove questions', function () {
    [$user, $teacher] = guruWithProfile();
    $subject = subjectForExams();
    $bank = bankForTeacher($teacher, $subject);
    $first = questionInBank($bank, 'Soal awal?');
    $second = questionInBank($bank, 'Soal pengganti?');
    $third = questionInBank($bank, 'Soal tambahan?');
    $class = SchoolClass::query()->create(['name' => '6B', 'academic_year' => '2026/2027']);

    $exam = Exam::query()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'school_class_id' => $class->id,
        'name' => 'Ujian Seleksi',
        'started_at' => Carbon::tomorrow(),
        'duration_minutes' => 60,
    ]);
    $exam->questions()->sync([$first->id => ['sort_order' => 1], $second->id => ['sort_order' => 2]]);

    $this->actingAs($user)
        ->put(route('teacher.exams.update', $exam), [
            'name' => 'Ujian Seleksi',
            'subject_id' => $subject->id,
            'school_class_id' => $class->id,
            'started_at' => Carbon::tomorrow()->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'question_ids' => [$second->id, $third->id],
        ])
        ->assertRedirect();

    expect($exam->questions()->pluck('questions.id')->map(fn ($id) => (int) $id)->sort()->values()->all())->toBe([$second->id, $third->id]);
    expect($exam->questions()->count())->toBe(2);
});
