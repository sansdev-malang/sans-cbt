<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $teacher_id
 * @property int $subject_id
 * @property int $school_class_id
 * @property string $name
 * @property string|null $description
 * @property Carbon $started_at
 * @property int $duration_minutes
 * @property bool $shuffle_questions
 * @property bool $shuffle_options
 * @property bool $show_result_immediately
 * @property bool $is_published
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Carbon $ends_at
 * @property-read string $status
 * @property-read Teacher|null $teacher
 * @property-read Subject $subject
 * @property-read SchoolClass $schoolClass
 */
#[Fillable([
    'teacher_id',
    'subject_id',
    'school_class_id',
    'name',
    'description',
    'started_at',
    'duration_minutes',
    'shuffle_questions',
    'shuffle_options',
    'show_result_immediately',
    'is_published',
    'published_at',
])]
class Exam extends Model
{
    /** @use HasFactory<\Database\Factories\ExamFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'published_at' => 'datetime',
            'duration_minutes' => 'integer',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'show_result_immediately' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    /**
     * The questions picked from the question banks, in exam order.
     *
     * @return BelongsToMany<Question, $this>
     */
    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'exam_questions')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order')
            ->withTimestamps();
    }

    /**
     * Student attempts on this exam.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ExamSession, $this>
     */
    public function sessions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ExamSession::class);
    }

    /**
     * Real (non-preview) student attempts on this exam.
     * Use this in all teacher-facing result/monitor/grading queries.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ExamSession, $this>
     */
    public function realSessions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ExamSession::class)->where('is_preview', false);
    }

    /**
     * The moment the exam closes, derived from the start time and duration.
     */
    protected function endsAt(): Attribute
    {
        return Attribute::get(
            fn (): \Illuminate\Support\Carbon => \Illuminate\Support\Carbon::instance($this->started_at)->addMinutes($this->duration_minutes),
        );
    }

    /**
     * Lifecycle status shown to teachers and students.
     */
    protected function status(): Attribute
    {
        return Attribute::get(function (): string {
            if (! $this->is_published) {
                return 'draft';
            }

            $now = now();

            return match (true) {
                $now->lt($this->started_at) => 'scheduled',
                $now->lte($this->ends_at) => 'ongoing',
                default => 'finished',
            };
        });
    }
}
