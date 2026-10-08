<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Role;
use App\Support\UnitContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SsoController extends Controller
{
    /**
     * Handle SSO Login from SANS (SD, SMP).
     */
    public function handle(Request $request)
    {
        if (! $request->has(['data', 'signature'])) {
            return redirect()->route('login')->withErrors(['email' => 'Token SSO tidak valid atau tidak ditemukan.']);
        }

        $secret = config('app.sso_secret', env('SSO_CBT_SECRET_KEY', env('SSO_SECRET_KEY', 'sans_cbt_secret_sso_key_2026')));
        $dataBase64 = $request->query('data');
        $signature = $request->query('signature');
        $expectedSignature = hash_hmac('sha256', $dataBase64, $secret);

        if (! hash_equals($expectedSignature, $signature)) {
            return redirect()->route('login')->withErrors(['email' => 'Tanda tangan SSO (Signature) tidak valid.']);
        }

        $decoded = json_decode(base64_decode($dataBase64), true);

        // Cek expiry timestamp (misal toleransi 15 menit)
        if (! $decoded || ! isset($decoded['timestamp']) || (time() - $decoded['timestamp']) > 900) {
            return redirect()->route('login')->withErrors(['email' => 'Sesi SSO telah kedaluwarsa. Silakan coba kembali dari portal utama.']);
        }

        $unit = $decoded['unit'] ?? 'sd';
        if (UnitContext::hasUnit($unit)) {
            UnitContext::setUnit($unit);
        }

        $userEmail = $decoded['email'] ?? null;
        if (! $userEmail && isset($decoded['id'])) {
            $userEmail = $unit . '_' . $decoded['id'] . '@sans.test';
        }

        $incomingRole = strtolower($decoded['role'] ?? 'guru');
        $resolvedRole = Role::Guru;

        if (in_array($incomingRole, ['super_admin', 'superadmin', 'admin', 'admin_sd', 'admin_smp'])) {
            $resolvedRole = Role::Admin;
        }

        $user = User::firstOrCreate(
            ['email' => $userEmail],
            [
                'name' => $decoded['name'] ?? ('Pengguna ' . strtoupper($unit)),
                'password' => 'sans12345',
                'role' => $resolvedRole,
            ]
        );

        if ($user->role !== $resolvedRole) {
            $user->update(['role' => $resolvedRole]);
        }

        session()->forget('url.intended');
        session(['active_unit' => $unit]);

        Auth::login($user);

        return redirect()->intended(
            $user->role === Role::Admin ? route('admin.dashboard') : route('dashboard')
        );
    }
}
