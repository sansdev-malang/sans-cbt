<?php

namespace App\Http\Controllers\Settings;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandingController
{
    public function edit(): Response
    {
        return Inertia::render('settings/branding');
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'favicon' => ['nullable', 'file', 'mimes:png,ico', 'max:1024'],
            'remove_logo' => ['sometimes', 'boolean'],
            'remove_favicon' => ['sometimes', 'boolean'],
        ], [
            'logo.image' => 'Logo harus berupa file gambar.',
            'logo.mimes' => 'Logo hanya boleh berformat PNG, JPG, atau WebP.',
            'logo.max' => 'Ukuran logo maksimal 2 MB.',
            'favicon.mimes' => 'Favicon hanya boleh berformat PNG atau ICO.',
            'favicon.max' => 'Ukuran favicon maksimal 1 MB.',
        ]);

        foreach (['logo', 'favicon'] as $field) {
            $key = "{$field}_path";
            $shouldRemove = $request->boolean("remove_{$field}");

            if (! $request->hasFile($field) && ! $shouldRemove) {
                continue;
            }

            $previousPath = DB::table('site_settings')->where('key', $key)->value('value');

            if ($shouldRemove && ! $request->hasFile($field)) {
                DB::table('site_settings')->where('key', $key)->delete();

                if (is_string($previousPath) && str_starts_with($previousPath, 'branding/')) {
                    Storage::disk('public')->delete($previousPath);
                }

                continue;
            }

            $path = $request->file($field)->storePublicly('branding', 'public');

            DB::table('site_settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $path, 'updated_at' => now(), 'created_at' => now()],
            );

            if (is_string($previousPath) && str_starts_with($previousPath, 'branding/')) {
                Storage::disk('public')->delete($previousPath);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Logo dan favicon berhasil diperbarui.']);

        return back();
    }
}
