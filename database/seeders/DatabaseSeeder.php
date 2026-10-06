<?php

namespace Database\Seeders;

use App\Models\User;
use App\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $accounts = [
            ['name' => 'Admin Sekolah', 'email' => 'admin@sekolahanaksaleh.sch.id', 'role' => Role::Admin],
            ['name' => 'Budi Santoso', 'email' => 'guru@sekolahanaksaleh.sch.id', 'role' => Role::Guru],
            ['name' => 'Siti Aminah', 'email' => 'siswa@sekolahanaksaleh.sch.id', 'role' => Role::Siswa],
            ['name' => 'Test User', 'email' => 'test@example.com', 'role' => Role::Admin],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->firstOrNew(['email' => $account['email']]);

            $user->name = $account['name'];
            $user->role = $account['role'];
            $user->email_verified_at ??= now();

            if (! $user->exists) {
                $user->password = 'password';
            }

            $user->save();
        }

        $this->call(MasterDataSeeder::class);
    }
}
