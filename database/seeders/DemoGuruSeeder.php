<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Demo data for the teacher area: a teacher profile, a question bank with sample
 * questions, one published exam, and ten dummy questions covering every question
 * type (several with generated images). Safe to run repeatedly.
 */
class DemoGuruSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::query()->where('email', 'guru@sekolahanaksaleh.sch.id')->first();

        if ($user === null) {
            return;
        }

        $teacher = Teacher::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['full_name' => 'Budi Santoso', 'nip' => '19870001', 'phone' => '081200000001'],
        );

        $subject = Subject::query()->where('name', 'like', '%Matematika%')->first()
            ?? Subject::query()->create(['code' => 'MTK', 'name' => 'Matematika', 'is_active' => true]);

        $bank = QuestionBank::query()->firstOrCreate(
            ['teacher_id' => $teacher->id, 'name' => 'Bank UTS Matematika'],
            ['subject_id' => $subject->id, 'material' => 'Operasi Pecahan'],
        );

        $exam = Exam::query()->firstOrCreate(
            ['name' => 'UTS Matematika Semester Ganjil'],
            [
                'teacher_id' => $teacher->id,
                'subject_id' => $subject->id,
                'school_class_id' => SchoolClass::query()->first()?->id,
                'description' => 'Kerjakan dengan teliti dan cermati satuan.',
                'started_at' => now()->addDay()->setTime(8, 0),
                'duration_minutes' => 90,
                'shuffle_questions' => true,
                'is_published' => true,
                'published_at' => now(),
            ],
        );

        // Demo inti: satu ujian beserta sesi siswa kedua agar halaman pantauan hidup.
        $this->seedSecondStudent($exam);

        // Sepuluh soal dummy yang mencakup semua tipe soal.
        $this->seedDummyQuestions($bank, $exam);
    }

    private function seedSecondStudent(Exam $exam): void
    {
        $secondUser = User::query()->firstOrCreate(
            ['email' => 'siswa2@sekolahanaksaleh.sch.id'],
            ['name' => 'Ali Imron', 'role' => \App\Role::Siswa, 'password' => \Illuminate\Support\Facades\Hash::make('password')],
        );
        $secondUser->forceFill(['email_verified_at' => now()])->save();

        $student = \App\Models\Student::query()->firstOrCreate(
            ['user_id' => $secondUser->id],
            ['full_name' => 'Ali Imron', 'nis' => '2002'],
        );

        $exam->schoolClass?->students()->syncWithoutDetaching([$student->id]);
    }

    /**
     * Attach a question to the demo exam and refresh the order of ongoing sessions.
     */
    private function attachToExam(Exam $exam, Question $question): void
    {
        if ($exam->questions()->whereKey($question->id)->exists()) {
            return;
        }

        $maxOrder = (int) $exam->questions()->max('exam_questions.sort_order');
        $exam->questions()->attach([$question->id => ['sort_order' => $maxOrder + 1]]);

        $order = $exam->questions()->orderBy('exam_questions.sort_order')->pluck('questions.id')->all();
        ExamSession::query()->where('exam_id', $exam->id)->where('status', 'ongoing')->update(['question_order' => $order]);
    }

    private function question(QuestionBank $bank, array $attributes): Question
    {
        $build = $attributes['build'] ?? null;
        unset($attributes['build']);

        $question = Question::query()->firstOrCreate(
            ['question_bank_id' => $bank->id, 'content' => $attributes['content']],
            $attributes,
        );

        if ($question->wasRecentlyCreated && $build !== null) {
            $build($question);
        }

        return $question;
    }

    /**
     * Ten dummy questions covering every question type; several include generated images.
     */
    private function seedDummyQuestions(QuestionBank $bank, Exam $exam): void
    {
        // 1-2. Pilihan ganda
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'multiple_choice', 'content' => 'Hasil dari 7 × 8 adalah...', 'difficulty' => 'Mudah', 'weight' => 2,
            'build' => fn (Question $q) => $q->options()->createMany([
                ['label' => 'A', 'content' => '54'], ['label' => 'B', 'content' => '56', 'is_correct' => true],
                ['label' => 'C', 'content' => '48'], ['label' => 'D', 'content' => '64'],
            ]),
        ]));
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'multiple_choice', 'content' => 'Pecahan yang senilai dengan 0,75 adalah...', 'difficulty' => 'Sedang', 'weight' => 2,
            'build' => fn (Question $q) => $q->options()->createMany([
                ['label' => 'A', 'content' => '3/4', 'is_correct' => true], ['label' => 'B', 'content' => '2/3'],
                ['label' => 'C', 'content' => '4/5'], ['label' => 'D', 'content' => '7/10'],
            ]),
        ]));

        // 3. Pilihan ganda bergambar
        if (function_exists('imagecreatetruecolor')) {
            $this->attachToExam($exam, $this->question($bank, [
                'type' => 'multiple_choice', 'content' => 'Perhatikan empat warna berikut! Warna campuran biru dan kuning adalah...', 'difficulty' => 'Mudah', 'weight' => 2,
                'build' => function (Question $q): void {
                    $q->options()->createMany([
                        ['label' => 'A', 'content' => 'Hijau', 'is_correct' => true, 'image_path' => $this->colorImage('dummy-warna-hijau.png', 60, 140, 60)],
                        ['label' => 'B', 'content' => 'Merah', 'image_path' => $this->colorImage('dummy-warna-merah.png', 200, 60, 60)],
                        ['label' => 'C', 'content' => 'Ungu', 'image_path' => $this->colorImage('dummy-warna-ungu.png', 130, 60, 160)],
                        ['label' => 'D', 'content' => 'Oranye', 'image_path' => $this->colorImage('dummy-warna-oranye.png', 230, 140, 40)],
                    ]);
                },
            ]));
        }

        // 4-5. Pilihan ganda kompleks
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'multiple_answers', 'content' => 'Pilih semua bilangan yang habis dibagi 3!', 'difficulty' => 'Sedang', 'weight' => 3,
            'build' => fn (Question $q) => $q->options()->createMany([
                ['label' => 'A', 'content' => '9', 'is_correct' => true], ['label' => 'B', 'content' => '10'],
                ['label' => 'C', 'content' => '12', 'is_correct' => true], ['label' => 'D', 'content' => '14'],
                ['label' => 'E', 'content' => '15', 'is_correct' => true],
            ]),
        ]));
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'multiple_answers', 'content' => 'Manakah yang merupakan bilangan prima?', 'difficulty' => 'Sulit', 'weight' => 3,
            'build' => fn (Question $q) => $q->options()->createMany([
                ['label' => 'A', 'content' => '2', 'is_correct' => true], ['label' => 'B', 'content' => '3', 'is_correct' => true],
                ['label' => 'C', 'content' => '4'], ['label' => 'D', 'content' => '5', 'is_correct' => true],
                ['label' => 'E', 'content' => '9'],
            ]),
        ]));

        // 6. Benar/salah
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'true_false', 'content' => 'Hasil dari 12 ÷ 4 adalah 3.', 'difficulty' => 'Mudah', 'weight' => 1,
            'build' => fn (Question $q) => null, // opsi Benar/Salah dibuat otomatis oleh sistem
        ]));

        // 7. Menjodohkan (benar-salah)
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'statement_true_false', 'content' => 'Nilailah pernyataan berikut tentang bilangan dan satuan!', 'difficulty' => 'Sedang', 'weight' => 3,
            'build' => fn (Question $q) => $q->options()->createMany([
                ['label' => 'A', 'content' => 'Setiap persegi adalah persegi panjang.', 'is_correct' => true],
                ['label' => 'B', 'content' => 'Separuh dari 50 adalah 20.', 'is_correct' => false],
                ['label' => 'C', 'content' => '1 jam sama dengan 60 menit.', 'is_correct' => true],
            ]),
        ]));

        // 8. Menjodohkan pasangan
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'matching', 'content' => 'Jodohkan pecahan dengan bentuk desimalnya!', 'difficulty' => 'Mudah', 'weight' => 4,
            'build' => fn (Question $q) => $q->pairs()->createMany([
                ['left_text' => '1/2', 'right_text' => '0,5', 'sort_order' => 1],
                ['left_text' => '1/4', 'right_text' => '0,25', 'sort_order' => 2],
                ['left_text' => '3/4', 'right_text' => '0,75', 'sort_order' => 3],
            ]),
        ]));

        // 9. Menjodohkan pasangan bergambar (bangun datar)
        if (function_exists('imagecreatetruecolor')) {
            $this->attachToExam($exam, $this->question($bank, [
                'type' => 'matching', 'content' => 'Jodohkan gambar bangun datar dengan namanya!', 'difficulty' => 'Mudah', 'weight' => 5,
                'build' => fn (Question $q) => $q->pairs()->createMany([
                    ['left_text' => 'Bangun pertama', 'left_image_path' => $this->shapeImage('dummy-bangun-segitiga.png', 'triangle'), 'right_text' => 'Segitiga', 'sort_order' => 1],
                    ['left_text' => 'Bangun kedua', 'left_image_path' => $this->shapeImage('dummy-bangun-persegi.png', 'square'), 'right_text' => 'Persegi', 'sort_order' => 2],
                    ['left_text' => 'Bangun ketiga', 'left_image_path' => $this->shapeImage('dummy-bangun-lingkaran.png', 'circle'), 'right_text' => 'Lingkaran', 'right_image_path' => $this->shapeImage('dummy-bangun-lingkaran.png', 'circle'), 'sort_order' => 3],
                ]),
            ]));
        }

        // 10. Esai
        $this->attachToExam($exam, $this->question($bank, [
            'type' => 'essay', 'content' => 'Ibu membeli 3/4 kg gula dan memakai 1/2 kg untuk membuat kue. Berapa kg sisa gula ibu? Jelaskan cara menghitungnya!', 'difficulty' => 'Sedang', 'weight' => 10,
            'build' => fn (Question $q) => null,
        ]));
    }

    /**
     * Solid color swatch image for color-themed questions.
     */
    private function colorImage(string $file, int $r, int $g, int $b): string
    {
        $image = imagecreatetruecolor(120, 80);
        $color = imagecolorallocate($image, $r, $g, $b);
        imagefill($image, 0, 0, $color);
        $this->drawImageBorder($image);

        return $this->storePng($image, $file);
    }

    /**
     * Simple shape drawing: triangle, square, or circle on a white canvas.
     */
    private function shapeImage(string $file, string $shape): string
    {
        $image = imagecreatetruecolor(120, 80);
        $white = imagecolorallocate($image, 255, 255, 255);
        $dark = imagecolorallocate($image, 40, 40, 40);
        imagefill($image, 0, 0, $white);

        match ($shape) {
            'triangle' => imagefilledpolygon($image, [60, 10, 110, 70, 10, 70], $dark),
            'square' => imagefilledrectangle($image, 30, 15, 90, 65, $dark),
            default => imagefilledellipse($image, 60, 40, 70, 60, $dark),
        };
        $this->drawImageBorder($image);

        return $this->storePng($image, $file);
    }

    private function drawImageBorder(\GdImage $image): void
    {
        $gray = imagecolorallocate($image, 150, 150, 150);
        imagerectangle($image, 0, 0, imagesx($image) - 1, imagesy($image) - 1, $gray);
    }

    private function storePng(\GdImage $image, string $file): string
    {
        ob_start();
        imagepng($image);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        $path = 'question-media/'.$file;
        Storage::disk('local')->put($path, $bytes);

        return $path;
    }
}
