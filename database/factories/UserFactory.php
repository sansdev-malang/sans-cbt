<?php

namespace Database\Factories;

use App\Models\User;
use App\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the user has the given role.
     */
    public function withRole(Role $role): static
    {
        return $this->state(fn (): array => [
            'role' => $role,
        ]);
    }

    /**
     * Indicate that the user is an administrator.
     */
    public function admin(): static
    {
        return $this->withRole(Role::Admin);
    }

    /**
     * Indicate that the user is a teacher.
     */
    public function guru(): static
    {
        return $this->withRole(Role::Guru);
    }

    /**
     * Indicate that the user is a student.
     */
    public function siswa(): static
    {
        return $this->withRole(Role::Siswa);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    // public function withTwoFactor(): static {}
}
