<?php

namespace App\Support;

class UnitContext
{
    public const UNIT_SD = 'sd';
    public const UNIT_SMP = 'smp';

    public const UNITS = [
        self::UNIT_SD => [
            'id' => 'sd',
            'code' => 'sd',
            'name' => 'SD',
            'full_name' => 'Sekolah Dasar (SD) Anak Saleh',
            'database' => 'sans-sd',
            'connection' => 'sans_sd',
            'grade_levels' => ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'],
            'color' => 'emerald',
            'is_active' => true,
        ],
        self::UNIT_SMP => [
            'id' => 'smp',
            'code' => 'smp',
            'name' => 'SMP',
            'full_name' => 'Sekolah Menengah Pertama (SMP) Anak Saleh',
            'database' => 'sans-smp',
            'connection' => 'sans_smp',
            'grade_levels' => ['Kelas 7', 'Kelas 8', 'Kelas 9'],
            'color' => 'indigo',
            'is_active' => true,
        ],
    ];

    /**
     * Get the active unit code ('sd' or 'smp').
     */
    public static function getUnit(): string
    {
        if (auth()->check()) {
            $user = auth()->user();
            if (!empty($user->active_unit) && isset(self::UNITS[$user->active_unit])) {
                return $user->active_unit;
            }
            if (!empty($user->unit_origin) && isset(self::UNITS[strtolower($user->unit_origin)])) {
                return strtolower($user->unit_origin);
            }
        }

        $sessionUnit = session('active_unit');
        if ($sessionUnit && isset(self::UNITS[$sessionUnit])) {
            return $sessionUnit;
        }

        return self::UNIT_SD;
    }

    /**
     * Set active unit in session and optional user model.
     */
    public static function setUnit(string $unit): void
    {
        $unit = strtolower(trim($unit));
        if (isset(self::UNITS[$unit])) {
            session(['active_unit' => $unit]);
            if (auth()->check()) {
                $user = auth()->user();
                if ($user && method_exists($user, 'isDirty')) {
                    $user->active_unit = $unit;
                    $user->save();
                }
            }
        }
    }

    /**
     * Check if a unit exists.
     */
    public static function hasUnit(string $unitCode): bool
    {
        return isset(self::UNITS[strtolower(trim($unitCode))]);
    }

    /**
     * Get database connection name ('sans_sd' or 'sans_smp').
     */
    public static function getConnection(?string $unit = null): string
    {
        $unitKey = strtolower(trim((string)($unit ?: self::getUnit())));
        return match ($unitKey) {
            'smp' => 'sans_smp',
            default => 'sans_sd',
        };
    }

    /**
     * Get unit details metadata.
     */
    public static function getUnitInfo(?string $unit = null): array
    {
        $unitKey = strtolower(trim((string)($unit ?: self::getUnit())));
        return self::UNITS[$unitKey] ?? self::UNITS[self::UNIT_SD];
    }

    /**
     * Get all registered units.
     */
    public static function getAllUnits(): array
    {
        return self::UNITS;
    }
}
