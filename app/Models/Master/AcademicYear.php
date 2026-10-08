<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends MasterModel
{
    protected $table = 'academic_years';
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class, 'academic_year_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'academic_year_id');
    }

    public function semesters(): HasMany
    {
        return $this->hasMany(Semester::class, 'academic_year_id');
    }
}
