<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remove the retired parent role so it cannot be cast as an active role.
     */
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'orang-tua')
            ->update(['role' => null]);
    }

    /**
     * The retired role must not be restored.
     */
    public function down(): void
    {
        // Intentionally irreversible.
    }
};
