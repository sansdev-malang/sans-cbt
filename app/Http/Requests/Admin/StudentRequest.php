<?php

namespace App\Http\Requests\Admin;

use App\Models\Student;
use App\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $student = $this->route('student');
        $studentId = $student instanceof Student ? $student->id : null;

        return [
            'user_id' => ['nullable', Rule::exists('users', 'id')->where('role', Role::Siswa->value), Rule::unique('students', 'user_id')->ignore($studentId)],
            'nis' => ['required', 'string', 'max:50', Rule::unique('students', 'nis')->ignore($studentId)],
            'nisn' => ['nullable', 'string', 'max:50', Rule::unique('students', 'nisn')->ignore($studentId)],
            'full_name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'birth_date' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'class_ids' => ['nullable', 'array'],
            'class_ids.*' => ['integer', Rule::exists('classes', 'id')],
        ];
    }
}
