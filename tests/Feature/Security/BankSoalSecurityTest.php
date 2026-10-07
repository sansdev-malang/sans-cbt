<?php

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Security suite for the question bank (spec 10): bank soal tidak boleh bocor
 * ke siswa, orang tua, tamu, maupun guru lain.
 */
function securityBankFixture(): array
{
    Storage::fake('local');

    $owner = User::factory()->guru()->create();
    $ownerTeacher = Teacher::query()->create(['user_id' => $owner->id, 'full_name' => 'Guru Pemilik']);
    $subject = Subject::query()->create(['code' => 'SEC-'.mt_rand(1000, 9999), 'name' => 'Mapel Rahasia', 'is_active' => true]);
    $bank = QuestionBank::query()->create(['teacher_id' => $ownerTeacher->id, 'subject_id' => $subject->id, 'name' => 'Bank Rahasia Owner']);

    $question = Question::query()->create([
        'question_bank_id' => $bank->id,
        'type' => 'multiple_choice',
        'content' => 'Soal rahasia: ibu kota Indonesia?',
        'difficulty' => 'Mudah',
        'weight' => 2,
        'image_path' => UploadedFile::fake()->image('rahasia.png')->store('question-media', 'local'),
    ]);
    $question->options()->createMany([
        ['label' => 'A', 'content' => 'Bandung'],
        ['label' => 'B', 'content' => 'Jakarta', 'is_correct' => true],
        ['label' => 'C', 'content' => 'Surabaya'],
        ['label' => 'D', 'content' => 'Medan'],
    ]);

    $otherGuru = User::factory()->guru()->create();
    $otherTeacher = Teacher::query()->create(['user_id' => $otherGuru->id, 'full_name' => 'Guru Lain']);
    $otherBank = QuestionBank::query()->create(['teacher_id' => $otherTeacher->id, 'subject_id' => $subject->id, 'name' => 'Bank Guru Lain']);

    $studentUser = User::factory()->siswa()->create();
    $student = Student::query()->create(['user_id' => $studentUser->id, 'full_name' => 'Siswa Try', 'nis' => (string) mt_rand(100000, 999999)]);

    $admin = User::factory()->admin()->create();

    return [$owner, $ownerTeacher, $otherGuru, $question, $bank, $otherBank, $studentUser, $admin];
}

test('guests can not reach any question bank route', function () {
    [$owner, , , $question, $bank] = securityBankFixture();

    $this->get(route('admin.questions.index'))->assertRedirect(route('login'));
    $this->get(route('admin.question-banks.show', $bank))->assertRedirect(route('login'));
    $this->get(route('teacher.questions.index'))->assertRedirect(route('login'));
    $this->get(route('teacher.questions.show', $question))->assertRedirect(route('login'));
    $this->get(route('teacher.question-banks.show', $bank))->assertRedirect(route('login'));
});

test('students are blocked from every admin and teacher question route', function () {
    [, , , $question, $bank] = securityBankFixture();
    $siswaUser = User::factory()->siswa()->create();

    foreach ([
        route('admin.questions.index'),
        route('admin.questions.show', $question),
        route('admin.question-banks.show', $bank),
        route('teacher.questions.index'),
        route('teacher.questions.show', $question),
        route('teacher.question-banks.show', $bank),
    ] as $url) {
        $this->actingAs($siswaUser)->get($url)->assertForbidden();
    }
});

test('a teacher can not open another teacher\'s question or bank', function () {
    [$owner, , $otherGuru, $question, $bank] = securityBankFixture();

    foreach ([
        route('teacher.questions.show', $question),
        route('teacher.question-banks.show', $bank),
    ] as $url) {
        $this->actingAs($otherGuru)->get($url)->assertForbidden();
    }

    $this->actingAs($otherGuru)
        ->put(route('teacher.questions.update', $question), [
            'question_bank_id' => $bank->id,
            'type' => 'multiple_choice',
            'content' => 'Dicuri!',
            'weight' => 1,
            'correct_option' => 0,
            'options' => [['content' => 'A'], ['content' => 'B'], ['content' => 'C'], ['content' => 'D']],
        ])->assertForbidden();

    $this->actingAs($otherGuru)->delete(route('teacher.questions.destroy', $question))->assertForbidden();
    $this->actingAs($otherGuru)
        ->put(route('teacher.question-banks.update', $bank), ['name' => 'Bank Direbut', 'subject_id' => $bank->subject_id])
        ->assertForbidden();
    $this->actingAs($otherGuru)->delete(route('teacher.question-banks.destroy', $bank))->assertForbidden();

    expect($question->fresh()->content)->toBe('Soal rahasia: ibu kota Indonesia?');
    expect($bank->fresh()->name)->toBe('Bank Rahasia Owner');
});

test('a teacher can not plant questions into another teacher\'s bank', function () {
    [$owner, , $otherGuru, , $bank] = securityBankFixture();

    $this->actingAs($otherGuru)
        ->post(route('teacher.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'essay',
            'content' => 'Soal selundupan',
            'weight' => 1,
        ])->assertForbidden();

    expect($bank->questions()->where('content', 'Soal selundupan')->exists())->toBeFalse();
});

test('teachers can not use the admin question endpoints', function () {
    [, , $otherGuru, $question, $bank] = securityBankFixture();

    $this->actingAs($otherGuru)->get(route('admin.questions.index'))->assertForbidden();
    $this->actingAs($otherGuru)->get(route('admin.questions.show', $question))->assertForbidden();
    $this->actingAs($otherGuru)->get(route('admin.question-banks.show', $bank))->assertForbidden();
    $this->actingAs($otherGuru)
        ->post(route('admin.question-banks.store'), ['name' => 'X', 'subject_id' => $bank->subject_id])
        ->assertForbidden();
});

test('question media is served only to admin, guru, and students with the exam', function () {
    [, , , $question] = securityBankFixture();
    $filename = basename($question->image_path);
    $url = route('admin.question-media.show', ['path' => $filename]);

    $this->get($url)->assertRedirect(route('login'));
    $this->get($url)->assertRedirect(route('login'));

    // siswa butuh gambar ini saat mengerjakan ujian
    $this->actingAs(User::factory()->siswa()->create())->get($url)->assertOk();

    // path traversal dan file asing ditolak
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.question-media.show', ['path' => '..%2Fsecrets.txt']))
        ->assertNotFound();
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.question-media.show', ['path' => 'tidak-ada.png']))
        ->assertNotFound();
});

test('the student work page never contains bank questions outside the exam or answer keys', function () {
    Storage::fake('local');
    [$owner, , , $question, $bank] = securityBankFixture();
    $class = SchoolClass::query()->create(['name' => 'SC-'.mt_rand(1000, 9999), 'academic_year' => '2026/2027']);

    $exam = Exam::query()->create([
        'teacher_id' => $owner->teacher->id,
        'subject_id' => $bank->subject_id,
        'school_class_id' => $class->id,
        'name' => 'Ujian Sesi Aman',
        'started_at' => now()->subMinutes(5),
        'duration_minutes' => 60,
        'is_published' => true,
        'published_at' => now()->subDay(),
    ]);
    $exam->questions()->sync([$question->id => ['sort_order' => 1]]);

    $studentUser = User::factory()->siswa()->create();
    $student = Student::query()->create(['user_id' => $studentUser->id, 'full_name' => 'Peserta', 'nis' => (string) mt_rand(100000, 999999)]);
    $class->students()->sync([$student->id]);

    $session = ExamSession::query()->create([
        'exam_id' => $exam->id,
        'student_id' => $student->id,
        'started_at' => now()->subMinutes(2),
        'status' => 'ongoing',
        'random_seed' => 9,
        'question_order' => [$question->id],
    ]);

    $content = $this->actingAs($studentUser)->get(route('student.exams.work', $session))->getContent() ?? '';

    // soal ujian boleh tampil; kunci jawaban tidak
    expect(str_contains($content, 'Soal rahasia: ibu kota Indonesia?'))->toBeTrue();
    expect(str_contains($content, 'is_correct'))->toBeFalse();

    // soal dari bank yang tidak diujikan tidak boleh ikut terkirim
    $secondQuestion = Question::query()->create([
        'question_bank_id' => $bank->id,
        'type' => 'essay',
        'content' => 'Soal cadangan yang tidak diujikan',
        'weight' => 1,
    ]);
    $contentAfter = $this->actingAs($studentUser)->get(route('student.exams.work', $session))->getContent() ?? '';
    expect(str_contains($contentAfter, 'Soal cadangan yang tidak diujikan'))->toBeFalse();
});

test('teacher bank pages only expose the owner\'s own questions', function () {
    [$owner, , $otherGuru, $question, $bank, $otherBank] = securityBankFixture();

    // bank milik guru lain tidak muncul di daftar
    $this->actingAs($owner)
        ->get(route('teacher.questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('banks.0.name', 'Bank Rahasia Owner')
            ->missing('banks.1'));

    // detail bank pemilik berisi soalnya sendiri
    $this->actingAs($owner)
        ->get(route('teacher.question-banks.show', $bank))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('bank.questions.0.content', 'Soal rahasia: ibu kota Indonesia?'));
});
