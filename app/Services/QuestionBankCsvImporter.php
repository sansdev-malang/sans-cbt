<?php

namespace App\Services;

use App\Models\QuestionBank;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuestionBankCsvImporter
{
    private const HEADERS = [
        'content', 'type', 'difficulty', 'weight', 'stimulus',
        'option_a', 'option_b', 'option_c', 'option_d', 'option_e',
        'correct_options', 'matching_pairs',
    ];

    /**
     * Import a CSV atomically. Every row is checked before any question is saved.
     */
    public function import(UploadedFile $file, QuestionBank $bank): int
    {
        $rows = $this->readRows($file);
        $questions = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            if (count(array_filter($row, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $parsed = $this->parseQuestion($row, $line, $errors);
            if ($parsed !== null) {
                $questions[] = $parsed;
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['file' => implode(' ', $errors)]);
        }

        if ($questions === []) {
            throw ValidationException::withMessages(['file' => 'File tidak berisi soal untuk diimpor.']);
        }

        DB::transaction(function () use ($questions, $bank): void {
            foreach ($questions as $data) {
                $question = $bank->questions()->create([
                    'content' => $data['content'],
                    'stimulus' => $data['stimulus'],
                    'type' => $data['type'],
                    'difficulty' => $data['difficulty'],
                    'weight' => $data['weight'],
                ]);

                if ($data['options'] !== []) {
                    $question->options()->createMany($data['options']);
                }

                if ($data['pairs'] !== []) {
                    $question->pairs()->createMany($data['pairs']);
                }
            }
        });

        return count($questions);
    }

    public function downloadTemplate(): StreamedResponse
    {
        $examples = [
            ['Contoh pilihan ganda: 2 + 2 = ...', 'multiple_choice', 'Mudah', '1', '', '3', '4', '5', '6', '', 'B', ''],
            ['Contoh pilihan ganda kompleks: pilih bilangan genap', 'multiple_answers', 'Sedang', '2', '', '1', '2', '3', '4', '', 'B,D', ''],
            ['Contoh benar atau salah', 'true_false', 'Mudah', '1', '', '', '', '', '', '', 'Benar', ''],
            ['Contoh pernyataan benar/salah', 'statement_true_false', 'Sedang', '1', '', 'Bumi mengelilingi Matahari', 'Matahari mengelilingi Bumi', '', '', '', 'A', ''],
            ['Contoh menjodohkan', 'matching', 'Sedang', '2', '', '', '', '', '', '', '', 'Jakarta=Indonesia; Tokyo=Jepang'],
            ['Contoh soal esai', 'essay', 'Sulit', '5', '', '', '', '', '', '', '', ''],
        ];

        return response()->streamDownload(function () use ($examples): void {
            $stream = fopen('php://output', 'wb');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, self::HEADERS, ';');
            foreach ($examples as $example) {
                fputcsv($stream, $example, ';');
            }
            fclose($stream);
        }, 'template-import-bank-soal.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @return list<array<string, string>> */
    private function readRows(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            throw ValidationException::withMessages(['file' => 'File CSV tidak dapat dibaca.']);
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'File CSV kosong.']);
        }

        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
        rewind($handle);
        $headers = fgetcsv($handle, 0, $delimiter, '"', '\\');
        if ($headers === false) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'Header CSV tidak valid.']);
        }

        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headers[0]) ?? (string) $headers[0];
        $headers = array_map(fn ($header) => strtolower(trim((string) $header)), $headers);
        foreach (['content', 'type', 'weight'] as $required) {
            if (! in_array($required, $headers, true)) {
                fclose($handle);
                throw ValidationException::withMessages(['file' => "Kolom wajib '{$required}' tidak ditemukan. Unduh template untuk format yang benar."]);
            }
        }

        $rows = [];
        while (($values = fgetcsv($handle, 0, $delimiter, '"', '\\')) !== false) {
            if (count($rows) >= 500) {
                fclose($handle);
                throw ValidationException::withMessages(['file' => 'Maksimal 500 soal dapat diimpor sekaligus.']);
            }
            $row = [];
            foreach ($headers as $column => $header) {
                $row[$header] = trim((string) ($values[$column] ?? ''));
            }
            $rows[] = $row;
        }

        fclose($handle);
        return $rows;
    }

    /** @param array<string, string> $row
     *  @param list<string> $errors
     *  @return array<string, mixed>|null
     */
    private function parseQuestion(array $row, int $line, array &$errors): ?array
    {
        $type = strtolower($row['type'] ?? '');
        $content = $row['content'] ?? '';
        $weight = filter_var($row['weight'] ?? null, FILTER_VALIDATE_INT);
        $difficulty = $row['difficulty'] ?? '';
        $rawOptions = array_map(fn ($key) => trim($row[$key] ?? ''), ['option_a', 'option_b', 'option_c', 'option_d', 'option_e']);
        $lastOption = -1;
        foreach ($rawOptions as $index => $option) {
            if ($option !== '') {
                $lastOption = $index;
            }
        }
        $options = array_slice($rawOptions, 0, $lastOption + 1);
        if (in_array('', $options, true)) {
            $errors[] = "Baris {$line}: opsi harus diisi berurutan mulai dari option_a.";
            $options = array_values(array_filter($options, fn ($option) => $option !== ''));
        }
        $answer = strtoupper(str_replace(' ', '', $row['correct_options'] ?? ''));
        $letters = $answer === '' ? [] : array_values(array_unique(explode(',', $answer)));
        $validTypes = ['multiple_choice', 'multiple_answers', 'true_false', 'statement_true_false', 'matching', 'essay'];

        if ($content === '' || mb_strlen($content) > 10000) {
            $errors[] = "Baris {$line}: isi soal wajib diisi (maksimal 10.000 karakter).";
        }
        if (mb_strlen($row['stimulus'] ?? '') > 10000) {
            $errors[] = "Baris {$line}: stimulus maksimal 10.000 karakter.";
        }
        if (! in_array($type, $validTypes, true)) {
            $errors[] = "Baris {$line}: tipe soal tidak valid.";
        }
        if ($weight === false || $weight < 1 || $weight > 100) {
            $errors[] = "Baris {$line}: bobot harus berupa angka 1–100.";
        }
        if ($difficulty !== '' && ! in_array($difficulty, ['Mudah', 'Sedang', 'Sulit'], true)) {
            $errors[] = "Baris {$line}: tingkat kesulitan harus Mudah, Sedang, atau Sulit.";
        }

        $normalizedOptions = [];
        $pairs = [];
        if (in_array($type, ['multiple_choice', 'multiple_answers', 'statement_true_false'], true)) {
            if (count($options) < 2 || count($options) > 5 || (in_array($type, ['multiple_choice', 'multiple_answers'], true) && count($options) < 4)) {
                $errors[] = "Baris {$line}: jumlah opsi tidak sesuai untuk tipe soal.";
            }
            foreach ($letters as $letter) {
                if (! in_array($letter, ['A', 'B', 'C', 'D', 'E'], true) || ! isset($options[ord($letter) - 65])) {
                    $errors[] = "Baris {$line}: jawaban benar harus berupa huruf opsi yang tersedia (A–E).";
                    break;
                }
            }
            if ($type === 'multiple_choice' && count($letters) !== 1) {
                $errors[] = "Baris {$line}: pilihan ganda harus memiliki tepat satu jawaban benar.";
            }
            if ($type === 'multiple_answers' && $letters === []) {
                $errors[] = "Baris {$line}: isi minimal satu jawaban benar.";
            }
            foreach ($options as $index => $option) {
                if (mb_strlen($option) > 5000) {
                    $errors[] = "Baris {$line}: isi opsi maksimal 5.000 karakter.";
                }
                $normalizedOptions[] = [
                    'label' => chr(65 + $index),
                    'content' => $option,
                    'is_correct' => in_array(chr(65 + $index), $letters, true),
                ];
            }
        } elseif ($type === 'true_false') {
            if (! in_array(mb_strtolower($row['correct_options'] ?? ''), ['benar', 'salah'], true)) {
                $errors[] = "Baris {$line}: jawaban benar/salah harus diisi Benar atau Salah.";
            }
            $correct = mb_strtolower($row['correct_options'] ?? '') === 'benar';
            $normalizedOptions = [
                ['label' => 'A', 'content' => 'Benar', 'is_correct' => $correct],
                ['label' => 'B', 'content' => 'Salah', 'is_correct' => ! $correct],
            ];
        } elseif ($type === 'matching') {
            $rawPairs = array_filter(array_map('trim', explode(';', $row['matching_pairs'] ?? '')));
            if (count($rawPairs) < 2 || count($rawPairs) > 8) {
                $errors[] = "Baris {$line}: menjodohkan harus berisi 2–8 pasangan.";
            }
            foreach ($rawPairs as $rawPair) {
                $parts = explode('=', $rawPair, 2);
                if (count($parts) !== 2 || trim($parts[0]) === '' || trim($parts[1]) === '' || mb_strlen(trim($parts[0])) > 500 || mb_strlen(trim($parts[1])) > 500) {
                    $errors[] = "Baris {$line}: format pasangan harus kiri=kanan dan dipisahkan titik koma.";
                    break;
                }
                $pairs[] = ['left_text' => trim($parts[0]), 'right_text' => trim($parts[1]), 'sort_order' => count($pairs) + 1];
            }
        }

        return [
            'content' => $content,
            'stimulus' => ($row['stimulus'] ?? '') !== '' ? $row['stimulus'] : null,
            'type' => $type,
            'difficulty' => $difficulty !== '' ? $difficulty : null,
            'weight' => $weight === false ? 1 : $weight,
            'options' => $normalizedOptions,
            'pairs' => $pairs,
        ];
    }
}
