import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    Database,
    GraduationCap,
    Layers,
    Loader2,
    RefreshCw,
    Search,
    Server,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes/admin';

type UnitStats = {
    students_count: number;
    active_students_count: number;
    classrooms_count: number;
    teachers_count: number;
    active_academic_year: {
        id: number;
        name: string;
        is_active: boolean;
    } | null;
    active_semester: {
        id: number;
        name: string;
        type: string;
    } | null;
};

type UnitStatus = {
    unit: string;
    info: {
        id: string;
        code: string;
        name: string;
        full_name: string;
        database: string;
        connection: string;
        grade_levels: string[];
        color: string;
    };
    connection: string;
    is_connected: boolean;
    latency_ms: number;
    error_message: string | null;
    database_name: string;
    host: string;
    port: string;
    stats: UnitStats;
    checked_at: string;
};

type PreviewItem = Record<string, any>;

type PreviewData = {
    type: string;
    title: string;
    data: PreviewItem[];
};

interface Props {
    unitsStatus: Record<string, UnitStatus>;
    activeUnit: string;
    availableUnits: Record<string, any>;
    previewData: PreviewData;
    previewType: string;
}

export default function DatabaseIntegrationsIndex({
    unitsStatus,
    activeUnit: initialActiveUnit,
    availableUnits,
    previewData: initialPreviewData,
    previewType: initialPreviewType,
}: Props) {
    const [activeUnit, setActiveUnit] = useState<string>(initialActiveUnit);
    const [previewType, setPreviewType] = useState<string>(initialPreviewType || 'students');
    const [previewData, setPreviewData] = useState<PreviewData>(initialPreviewData);
    const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
    const [testingUnit, setTestingUnit] = useState<string | null>(null);
    const [testingAll, setTestingAll] = useState<boolean>(false);
    const [searchFilter, setSearchFilter] = useState<string>('');

    // Switch Active Unit in CBT
    const handleSwitchUnit = async (unitKey: string) => {
        if (unitKey === activeUnit) return;

        try {
            const res = await fetch('/admin/integrations/switch-unit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ unit: unitKey }),
            });
            const data = await res.json();
            if (data.success) {
                setActiveUnit(unitKey);
                toast.success('Unit Berhasil Dialihkan', {
                    description: `Sekarang CBT aktif mengelola data untuk ${unitKey.toUpperCase()}.`,
                });
                loadPreview(unitKey, previewType);
            }
        } catch (err: any) {
            toast.error('Gagal Mengalihkan Unit', { description: err.message });
        }
    };

    // Test Connection for a Single Unit
    const handleTestConnection = async (unitKey: string) => {
        setTestingUnit(unitKey);
        try {
            const res = await fetch('/admin/integrations/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ unit: unitKey }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Koneksi Database Berhasil!', {
                    description: data.message,
                });
            } else {
                toast.error('Koneksi Database Gagal', {
                    description: data.message,
                });
            }
        } catch (err: any) {
            toast.error('Kesalahan Jaringan', { description: err.message });
        } finally {
            setTestingUnit(null);
        }
    };

    // Test All Database Connections
    const handleTestAll = async () => {
        setTestingAll(true);
        for (const unitKey of Object.keys(unitsStatus)) {
            await handleTestConnection(unitKey);
        }
        setTestingAll(false);
        router.reload();
    };

    // Load Live Preview Data via JSON
    const loadPreview = async (unitKey: string, type: string) => {
        setLoadingPreview(true);
        try {
            const res = await fetch(`/admin/integrations/preview?unit=${unitKey}&type=${type}&limit=20`, {
                headers: { 'Accept': 'application/json' },
            });
            const result = await res.json();
            if (result.success && result.preview) {
                setPreviewData(result.preview);
            }
        } catch (err: any) {
            toast.error('Gagal Memuat Preview Data', { description: err.message });
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleTabChange = (type: string) => {
        setPreviewType(type);
        loadPreview(activeUnit, type);
    };

    const handlePreviewUnitChange = (unitKey: string) => {
        handleSwitchUnit(unitKey);
    };

    // Filter preview records by search text
    const filteredRecords = (previewData?.data || []).filter((item) => {
        if (!searchFilter) return true;
        const s = searchFilter.toLowerCase();
        return Object.values(item).some(
            (val) => val && String(val).toLowerCase().includes(s)
        );
    });

    const totalStudentsAll = Object.values(unitsStatus).reduce((sum, u) => sum + (u.stats.students_count || 0), 0);
    const totalClassesAll = Object.values(unitsStatus).reduce((sum, u) => sum + (u.stats.classrooms_count || 0), 0);
    const totalTeachersAll = Object.values(unitsStatus).reduce((sum, u) => sum + (u.stats.teachers_count || 0), 0);

    return (
        <>
            <Head title="Integrasi Database & Unit Sekolah" />

            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Title & Global Actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <Database className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    Integrasi Database & Unit Sekolah
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Arsitektur Multi-Database langsung ke <span className="font-semibold text-emerald-600 dark:text-emerald-400">sans-sd (SD)</span> dan <span className="font-semibold text-indigo-600 dark:text-indigo-400">sans-smp (SMP)</span> untuk sinkronisasi data master ujian.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload()}
                            className="text-xs font-semibold"
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Refresh Status
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleTestAll}
                            disabled={testingAll}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                        >
                            {testingAll ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Menguji Semua...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                                    Uji Semua Koneksi DB
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Top Summary Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Siswa Terhubung</p>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {totalStudentsAll.toLocaleString()}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-medium">SD + SMP</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40 shrink-0">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rombongan Belajar</p>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {totalClassesAll.toLocaleString()}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-medium">Kelas Aktif</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40 shrink-0">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Guru & Pengawas</p>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {totalTeachersAll.toLocaleString()}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-medium">Tenaga Pendidik</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                        <CardContent className="p-4 flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shrink-0">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Metode Integrasi</p>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
                                        Direct Multi-DB
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-medium">Real-time</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* UNIT DATABASE CARDS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {Object.entries(unitsStatus).map(([key, u]) => {
                        const isUnitActive = activeUnit === key;
                        const isSd = key === 'sd';
                        const themeColor = isSd ? 'emerald' : 'indigo';

                        return (
                            <Card
                                key={key}
                                className={`border transition-all shadow-sm ${
                                    isUnitActive
                                        ? isSd
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10'
                                            : 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-indigo-950/10'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                }`}
                            >
                                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-xs ${
                                                    isSd
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-indigo-600 text-white'
                                                }`}
                                            >
                                                {u.info.name}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                        {u.info.full_name}
                                                    </CardTitle>
                                                    {isUnitActive && (
                                                        <Badge className={`${isSd ? 'bg-emerald-600' : 'bg-indigo-600'} text-white text-[10px] font-bold`}>
                                                            Unit Aktif
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardDescription className="text-xs font-mono mt-0.5 text-slate-500">
                                                    Koneksi: <strong className="text-slate-700 dark:text-slate-300">{u.connection}</strong> &bull; DB: <strong className="text-slate-700 dark:text-slate-300">{u.database_name}</strong>
                                                </CardDescription>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            {u.is_connected ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Online ({u.latency_ms} ms)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
                                                    <AlertCircle className="w-3 h-3 text-rose-500" />
                                                    Offline
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 space-y-4">
                                    {/* Connection Specs */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                                        <div>
                                            <span className="text-[10.5px] text-slate-400 block">Host & Port</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                {u.host}:{u.port}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10.5px] text-slate-400 block">Database</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                {u.database_name}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10.5px] text-slate-400 block">Tapel Aktif</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                {u.stats.active_academic_year ? `TA ${u.stats.active_academic_year.name}` : '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10.5px] text-slate-400 block">Semester</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                {u.stats.active_semester?.name || 'Ganjil'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Real-time Data Metrics */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                                            <span className="text-[11px] text-slate-400 font-medium block">Siswa Aktif</span>
                                            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                                                {u.stats.active_students_count.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">dari {u.stats.students_count}</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                                            <span className="text-[11px] text-slate-400 font-medium block">Rombel</span>
                                            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                                                {u.stats.classrooms_count}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">Kelas Terdaftar</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                                            <span className="text-[11px] text-slate-400 font-medium block">Guru / Pendidik</span>
                                            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                                                {u.stats.teachers_count}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">Akun Master</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTestConnection(key)}
                                            disabled={testingUnit === key}
                                            className="text-xs font-semibold"
                                        >
                                            {testingUnit === key ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                    Menguji...
                                                </>
                                            ) : (
                                                <>
                                                    <Activity className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                                                    Uji Koneksi
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSwitchUnit(key)}
                                            disabled={isUnitActive}
                                            className={`text-xs font-bold ${
                                                isUnitActive
                                                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-not-allowed'
                                                    : isSd
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            {isUnitActive ? 'Sedang Aktif' : `Pilih Unit ${u.info.name}`}
                                            {!isUnitActive && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* LIVE MASTER DATA INSPECTOR SECTION */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-emerald-600" />
                                        Live Inspector Master Data ({activeUnit.toUpperCase()})
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        Database: sans-{activeUnit}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs mt-0.5">
                                    Melihat data master yang berhasil dibaca secara langsung dari database unit terpilih.
                                </CardDescription>
                            </div>

                            {/* Unit Switcher Pill for Inspector */}
                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handlePreviewUnitChange('sd')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        activeUnit === 'sd'
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Unit SD
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePreviewUnitChange('smp')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        activeUnit === 'smp'
                                            ? 'bg-indigo-600 text-white shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Unit SMP
                                </button>
                            </div>
                        </div>

                        {/* Inspector Tabs */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 mt-2">
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('students')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        previewType === 'students'
                                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Data Siswa</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('classrooms')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        previewType === 'classrooms'
                                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span>Rombel & Wali Kelas</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('teachers')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        previewType === 'teachers'
                                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Guru & Pendidik</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('academic_years')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        previewType === 'academic_years'
                                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Tahun Pelajaran</span>
                                </button>
                            </div>

                            {/* Quick search */}
                            <div className="relative w-full sm:w-60">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari data..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="pl-8 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {loadingPreview ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                <p className="text-xs font-medium">Membaca data master dari database sans-{activeUnit}...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50/75 dark:bg-slate-950/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                                        {previewType === 'students' && (
                                            <tr>
                                                <th className="px-4 py-3">NIS</th>
                                                <th className="px-4 py-3">Nama Siswa</th>
                                                <th className="px-4 py-3">Jenis Kelamin</th>
                                                <th className="px-4 py-3">Rombel / Kelas</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                            </tr>
                                        )}
                                        {previewType === 'classrooms' && (
                                            <tr>
                                                <th className="px-4 py-3">Kode</th>
                                                <th className="px-4 py-3">Nama Rombel</th>
                                                <th className="px-4 py-3">Tingkat Kelas</th>
                                                <th className="px-4 py-3">Tahun Pelajaran</th>
                                                <th className="px-4 py-3">Wali Kelas</th>
                                            </tr>
                                        )}
                                        {previewType === 'teachers' && (
                                            <tr>
                                                <th className="px-4 py-3">NIP</th>
                                                <th className="px-4 py-3">Nama Guru</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">No. Telepon / WA</th>
                                                <th className="px-4 py-3">Jabatan</th>
                                            </tr>
                                        )}
                                        {previewType === 'academic_years' && (
                                            <tr>
                                                <th className="px-4 py-3">Tahun Pelajaran</th>
                                                <th className="px-4 py-3">Daftar Semester</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredRecords.length > 0 ? (
                                            filteredRecords.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                    {previewType === 'students' && (
                                                        <>
                                                            <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                                {row.nis}
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                                {row.name}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {row.gender}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                    {row.classroom}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}
                                                    {previewType === 'classrooms' && (
                                                        <>
                                                            <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                {row.code || row.name}
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                                {row.name}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {row.level}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {row.academic_year}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                                {row.homeroom_teacher}
                                                            </td>
                                                        </>
                                                    )}
                                                    {previewType === 'teachers' && (
                                                        <>
                                                            <td className="px-4 py-3 font-mono text-slate-500">
                                                                {row.nip}
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                                {row.name}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {row.email}
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                                                                {row.phone}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {row.position}
                                                            </td>
                                                        </>
                                                    )}
                                                    {previewType === 'academic_years' && (
                                                        <>
                                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                                                                {row.name}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {row.semesters || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {row.is_active ? (
                                                                    <Badge className="bg-emerald-600 text-white text-[10px]">
                                                                        Aktif
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-slate-400 text-[10px]">
                                                                        Arsip
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                                    Tidak ada data ditemukan untuk kriteria pencarian.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Architecture & Documentation Card */}
                <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-indigo-500/5 shadow-xs">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 shrink-0 shadow-2xs">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Single Source of Truth & Zero Sync Overhead
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                                    Data siswa, rombel, dan guru dibaca langsung dari database master unit masing-masing. Tidak ada duplikasi data, sehingga setiap perubahan mutasi siswa atau jadwal rombel di aplikasi SD/SMP langsung terdeteksi otomatis oleh CBT.
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Siap Ujian CBT
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

DatabaseIntegrationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Integrasi Database', href: '/admin/integrations' },
    ],
};
