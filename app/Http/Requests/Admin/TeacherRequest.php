<?php

namespace App\Http\Requests\Admin;

use App\Models\Teacher;
use App\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TeacherRequest extends FormRequest
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
        $teacher = $this->route('teacher');
        $teacherId = $teacher instanceof Teacher ? $teacher->id : null;

        return [
            'user_id' => ['nullable', Rule::exists('users', 'id')->where('role', Role::Guru->value), Rule::unique('teachers', 'user_id')->ignore($teacherId)],
            'nip' => ['nullable', 'string', 'max:50', Rule::unique('teachers', 'nip')->ignore($teacherId)],
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
