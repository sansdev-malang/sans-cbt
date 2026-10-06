<?php

use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function createQuestionBank(): QuestionBank
{
    $subject = Subject::query()->create(['code' => 'MTK', 'name' => 'Matematika', 'is_active' => true]);

    return QuestionBank::query()->create(['subject_id' => $subject->id, 'name' => 'Bank Ujian Tengah Semester', 'material' => 'Operasi Hitung']);
}

test('admin can create a multiple choice question with its answer key', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'multiple_choice',
            'content' => 'Hasil dari 12 + 15 adalah...',
            'difficulty' => 'Mudah',
            'weight' => 5,
            'correct_option' => 2,
            'options' => [
                ['content' => '25'],
                ['content' => '26'],
                ['content' => '27'],
                ['content' => '28'],
            ],
        ])
        ->assertRedirect();

    $question = Question::query()->where('content', 'Hasil dari 12 + 15 adalah...')->first();
    expect($question)->not->toBeNull();
    expect($question->type)->toBe('multiple_choice');
    expect($question->options()->count())->toBe(4);
    expect($question->options()->where('is_correct', true)->value('label'))->toBe('C');
});

test('admin can create a true/false question that is normalized to Benar and Salah options', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'true_false',
            'content' => 'Setiap bilangan prima pasti ganjil.',
            'weight' => 2,
            'correct_option' => 1,
        ])
        ->assertRedirect();

    $question = Question::query()->where('content', 'Setiap bilangan prima pasti ganjil.')->first();
    expect($question->type)->toBe('true_false');
    expect($question->options()->orderBy('id')->pluck('content')->all())->toBe(['Benar', 'Salah']);
    expect($question->options()->where('is_correct', true)->value('content'))->toBe('Salah');
});

test('admin can create an essay question without options', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'essay',
            'content' => 'Jelaskan cara menghitung luas persegi panjang.',
            'weight' => 10,
        ])
        ->assertRedirect();

    $question = Question::query()->where('type', 'essay')->first();
    expect($question->options()->count())->toBe(0);
});

test('multiple choice questions require at least four options', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'multiple_choice',
            'content' => 'Soal dengan pilihan kurang?',
            'weight' => 1,
            'correct_option' => 0,
            'options' => [['content' => 'A'], ['content' => 'B'], ['content' => 'C']],
        ])
        ->assertSessionHasErrors('options');
});

test('admin can upload a question image served through the protected media route', function () {
    Storage::fake('local');
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'multiple_choice',
            'content' => 'Bangun datar pada gambar adalah...',
            'weight' => 3,
            'correct_option' => 0,
            'image' => UploadedFile::fake()->image('soal.png'),
            'options' => [
                ['content' => 'Persegi', 'image' => UploadedFile::fake()->image('persegi.png')],
                ['content' => 'Lingkaran'],
                ['content' => 'Segitiga'],
                ['content' => 'Trapesium'],
            ],
        ])
        ->assertRedirect();

    $question = Question::query()->where('content', 'Bangun datar pada gambar adalah...')->first();
    expect($question->image_path)->toBeString();
    expect($question->options()->whereNotNull('image_path')->count())->toBe(1);
    Storage::disk('local')->assertExists($question->image_path);
    Storage::disk('local')->assertExists($question->options()->whereNotNull('image_path')->value('image_path'));

    $this->actingAs($admin)
        ->get($question->fresh()->image_url)
        ->assertOk();
});

test('question media is not accessible for guests', function () {
    Storage::fake('local');
    UploadedFile::fake()->image('soal.png')->storeAs('question-media', 'rahasia.png', 'local');

    $this->get(route('admin.question-media.show', ['path' => 'rahasia.png']))
        ->assertRedirect(route('login'));
});

test('question media rejects unexpected file paths', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get(route('admin.question-media.show', ['path' => '..%2Fsecrets.txt']))->assertNotFound();
    $this->actingAs($admin)->get(route('admin.question-media.show', ['path' => 'tidak-ada.png']))->assertNotFound();
});

test('replacing a question image deletes the old stored file', function () {
    Storage::fake('local');
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();
    $question = Question::query()->create([
        'question_bank_id' => $bank->id,
        'type' => 'multiple_choice',
        'content' => 'Soal lama',
        'weight' => 1,
        'image_path' => UploadedFile::fake()->image('lama.png')->store('question-media', 'local'),
    ]);

    $oldPath = $question->image_path;

    $this->actingAs($admin)
        ->put(route('admin.questions.update', $question), [
            'type' => 'multiple_choice',
            'content' => 'Soal lama',
            'weight' => 1,
            'correct_option' => 0,
            'options' => [['content' => 'A'], ['content' => 'B'], ['content' => 'C'], ['content' => 'D']],
            'image' => UploadedFile::fake()->image('baru.png'),
        ])
        ->assertRedirect();

    Storage::disk('local')->assertMissing($oldPath);
    Storage::disk('local')->assertExists($question->fresh()->image_path);
});

test('deleting a question removes its media files', function () {
    Storage::fake('local');
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();
    $question = Question::query()->create([
        'question_bank_id' => $bank->id,
        'type' => 'multiple_choice',
        'content' => 'Soal akan dihapus',
        'weight' => 1,
        'image_path' => UploadedFile::fake()->image('soal.png')->store('question-media', 'local'),
    ]);
    $option = $question->options()->create(['label' => 'A', 'content' => 'A', 'is_correct' => true, 'image_path' => UploadedFile::fake()->image('opsi.png')->store('question-media', 'local')]);

    $this->actingAs($admin)
        ->delete(route('admin.questions.destroy', $question))
        ->assertRedirect(route('admin.questions.index'));

    Storage::disk('local')->assertMissing($question->image_path);
    Storage::disk('local')->assertMissing($option->image_path);
    expect(Question::query()->find($question->id))->toBeNull();
});

test('admin can create a complex multiple choice question with several correct keys', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'multiple_answers',
            'content' => 'Pilih semua bilangan prima berikut!',
            'weight' => 4,
            'correct_options' => [0, 2],
            'options' => [
                ['content' => '2'],
                ['content' => '4'],
                ['content' => '7'],
                ['content' => '9'],
            ],
        ])
        ->assertRedirect();

    $question = Question::query()->where('content', 'Pilih semua bilangan prima berikut!')->first();
    expect($question->type)->toBe('multiple_answers');
    expect($question->options()->where('is_correct', true)->pluck('label')->all())->toBe(['A', 'C']);
    expect($question->options()->count())->toBe(4);
});

test('admin can create a statement true/false matching question', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'statement_true_false',
            'content' => 'Nilailah pernyataan berikut!',
            'weight' => 3,
            'statements' => [
                ['content' => 'Semua bilangan genap habis dibagi 2.', 'is_true' => '1', 'image' => UploadedFile::fake()->image('genap.png')],
                ['content' => 'Nol adalah bilangan prima.', 'is_true' => '0'],
                ['content' => 'Hasil 5 x 0 adalah 0.', 'is_true' => '1'],
            ],
        ])
        ->assertRedirect();

    $question = Question::query()->where('content', 'Nilailah pernyataan berikut!')->first();
    expect($question->type)->toBe('statement_true_false');
    $options = $question->options()->orderBy('id')->get();
    expect($options->pluck('content')->all())->toBe(['Semua bilangan genap habis dibagi 2.', 'Nol adalah bilangan prima.', 'Hasil 5 x 0 adalah 0.']);
    expect($options->pluck('is_correct')->all())->toBe([true, false, true]);
    expect($options->firstWhere('content', 'Semua bilangan genap habis dibagi 2.')->image_path)->toBeString();
});

test('admin can create a drag & drop matching question with pairs', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'matching',
            'content' => 'Jodohkan hewan berikut dengan suaranya!',
            'weight' => 5,
            'pairs' => [
                ['left_text' => 'Ayam', 'right_text' => 'Kukuruyuk', 'left_image' => UploadedFile::fake()->image('ayam.png')],
                ['left_text' => 'Kucing', 'right_text' => 'Meong'],
                ['left_text' => 'Sapi', 'right_text' => 'Moo', 'right_image' => UploadedFile::fake()->image('sapi.png')],
            ],
        ])
        ->assertRedirect();

    $question = Question::query()->where('content', 'Jodohkan hewan berikut dengan suaranya!')->first();
    expect($question->type)->toBe('matching');
    expect($question->options()->count())->toBe(0);
    $pairs = $question->pairs()->orderBy('sort_order')->get();
    expect($pairs->pluck('left_text')->all())->toBe(['Ayam', 'Kucing', 'Sapi']);
    expect($pairs->pluck('right_text')->all())->toBe(['Kukuruyuk', 'Meong', 'Moo']);
    expect($pairs->get(0)->left_image_path)->toBeString();
    expect($pairs->get(1)->left_image_path)->toBeNull();
    expect($pairs->get(2)->right_image_path)->toBeString();
});

test('matching questions require at least two pairs', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'matching',
            'content' => 'Jodohkan!',
            'weight' => 1,
            'pairs' => [['left_text' => 'Satu', 'right_text' => 'One']],
        ])
        ->assertSessionHasErrors('pairs');
});

test('complex multiple choice requires at least one correct key', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'multiple_answers',
            'content' => 'Pilih jawaban benar!',
            'weight' => 1,
            'options' => [['content' => 'A'], ['content' => 'B'], ['content' => 'C'], ['content' => 'D']],
        ])
        ->assertSessionHasErrors('correct_options');
});

test('admin can update and delete a question bank', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->put(route('admin.question-banks.update', $bank), ['name' => 'Bank PAS', 'subject_id' => $bank->subject_id, 'material' => 'Pecahan'])
        ->assertRedirect();

    expect($bank->fresh()->name)->toBe('Bank PAS');

    $this->actingAs($admin)
        ->delete(route('admin.question-banks.destroy', $bank))
        ->assertRedirect();

    expect(QuestionBank::query()->find($bank->id))->toBeNull();
});

test('admin can view a question bank detail page with its questions', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();
    $question = Question::query()->create(['question_bank_id' => $bank->id, 'type' => 'essay', 'content' => 'Jelaskan proses fotosintesis.', 'difficulty' => 'Sedang', 'weight' => 10]);

    $this->actingAs($admin)
        ->get(route('admin.question-banks.show', $bank))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/questions/bank')
            ->where('bank.id', $bank->id)
            ->where('bank.questions_count', 1)
            ->where('bank.questions.0.id', $question->id)
            ->has('subjects')
            ->has('classes')
            ->has('teachers'));
});

test('admin is redirected to the bank detail page after creating a bank', function () {
    $admin = User::factory()->admin()->create();
    $subject = Subject::query()->create(['code' => 'BIO', 'name' => 'Biologi', 'is_active' => true]);

    $response = $this->actingAs($admin)
        ->post(route('admin.question-banks.store'), ['name' => 'Bank Biologi', 'subject_id' => $subject->id]);

    $bank = QuestionBank::query()->where('name', 'Bank Biologi')->firstOrFail();
    $response->assertRedirect(route('admin.question-banks.show', $bank));
});

test('admin can create and update a question with stimulus', function () {
    $admin = User::factory()->admin()->create();
    $bank = createQuestionBank();

    $this->actingAs($admin)
        ->post(route('admin.questions.store'), [
            'question_bank_id' => $bank->id,
            'type' => 'multiple_choice',
            'stimulus' => 'Bacalah teks berikut untuk menjawab soal nomor 1-3: Di sebuah desa terpencil...',
            'content' => 'Di manakah latar peristiwa dalam cerita di atas?',
            'difficulty' => 'Sedang',
            'weight' => 5,
            'correct_option' => 0,
            'options' => [
                ['content' => 'Di desa terpencil'],
                ['content' => 'Di perkotaan'],
                ['content' => 'Di pinggir pantai'],
                ['content' => 'Di pegunungan'],
            ],
        ])
        ->assertRedirect();

    $question = Question::query()->where('content', 'Di manakah latar peristiwa dalam cerita di atas?')->first();
    expect($question)->not->toBeNull();
    expect($question->stimulus)->toBe('Bacalah teks berikut untuk menjawab soal nomor 1-3: Di sebuah desa terpencil...');

    $this->actingAs($admin)
        ->put(route('admin.questions.update', $question), [
            'type' => 'multiple_choice',
            'stimulus' => 'Teks stimulus yang diperbarui...',
            'content' => 'Di manakah latar peristiwa dalam cerita di atas? (Revisi)',
            'difficulty' => 'Mudah',
            'weight' => 10,
            'correct_option' => 1,
            'options' => [
                ['content' => 'Pilihan A'],
                ['content' => 'Pilihan B'],
                ['content' => 'Pilihan C'],
                ['content' => 'Pilihan D'],
            ],
        ])
        ->assertRedirect();

    $question->refresh();
    expect($question->stimulus)->toBe('Teks stimulus yang diperbarui...');
    expect($question->content)->toBe('Di manakah latar peristiwa dalam cerita di atas? (Revisi)');
});
