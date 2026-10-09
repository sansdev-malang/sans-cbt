<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classroom extends MasterModel
{
    protected $table = 'classrooms';
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'capacity' => 'integer',
    ];

    protected $appends = [
        'full_name',
    ];

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class, 'class_level_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function homeroomTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'homeroom_teacher_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'classroom_id');
    }

    /**
     * Get combined display name (e.g. "1A Berlian" or "7A - Samudra Pasai").
     */
    public function getFullNameAttribute(): string
    {
        if ($this->code && $this->name) {
            if (str_starts_with(strtoupper($this->name), strtoupper($this->code))) {
                return $this->name;
            }
            return "{$this->code} {$this->name}";
        }
        return $this->name ?: ($this->code ?: '-');
    }
}
