<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassLevel extends MasterModel
{
    protected $table = 'class_levels';
    protected $guarded = ['id'];

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class, 'class_level_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_level_id');
    }
}
