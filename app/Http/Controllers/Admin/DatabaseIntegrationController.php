<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DatabaseIntegrationService;
use App\Support\UnitContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DatabaseIntegrationController extends Controller
{
    protected DatabaseIntegrationService $service;

    public function __construct(DatabaseIntegrationService $service)
    {
        $this->service = $service;
    }

    /**
     * Display database integration overview page.
     */
    public function index(Request $request): Response
    {
        $activeUnit = $request->get('unit', UnitContext::getUnit());
        if (UnitContext::hasUnit($activeUnit)) {
            UnitContext::setUnit($activeUnit);
        }

        $unitsStatus = $this->service->getAllUnitsStatus();
        $previewType = $request->get('preview_type', 'students');
        $previewData = $this->service->previewMasterData($activeUnit, $previewType, 15);

        return Inertia::render('admin/integrations/index', [
            'unitsStatus' => $unitsStatus,
            'activeUnit' => $activeUnit,
            'availableUnits' => UnitContext::getAllUnits(),
            'previewData' => $previewData,
            'previewType' => $previewType,
        ]);
    }

    /**
     * Test single unit database connection.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit' => 'required|string|in:sd,smp',
        ]);

        $result = $this->service->testConnection($validated['unit']);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Fetch master data live preview via JSON.
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit' => 'required|string|in:sd,smp',
            'type' => 'nullable|string|in:students,classrooms,teachers,academic_years',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $unit = $validated['unit'];
        $type = $validated['type'] ?? 'students';
        $limit = $validated['limit'] ?? 15;

        $preview = $this->service->previewMasterData($unit, $type, $limit);

        return response()->json([
            'success' => true,
            'unit' => $unit,
            'preview' => $preview,
        ]);
    }

    /**
     * Switch active unit.
     */
    public function switchUnit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit' => 'required|string|in:sd,smp',
        ]);

        UnitContext::setUnit($validated['unit']);

        return response()->json([
            'success' => true,
            'active_unit' => $validated['unit'],
            'message' => 'Unit aktif berhasil dialihkan ke ' . strtoupper($validated['unit']),
        ]);
    }

    /**
     * Synchronize master data from SD / SMP into CBT local database.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit' => 'nullable|string|in:sd,smp,all',
        ]);

        $unit = $validated['unit'] ?? 'all';
        $summary = $this->service->syncMasterData($unit);

        return response()->json([
            'success' => empty($summary['errors']),
            'summary' => $summary,
            'message' => "Sinkronisasi berhasil! {$summary['students_synced']} siswa, {$summary['classes_synced']} kelas, dan {$summary['teachers_synced']} guru berhasil disinkronkan ke database CBT.",
        ]);
    }
}
