import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Database,
    GraduationCap,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

interface Props {
    unitsStatus: Record<string, UnitStatus>;
    activeUnit: string;
    availableUnits: Record<string, any>;
}

export default function DatabaseIntegrationsIndex({
    unitsStatus,
    activeUnit: initialActiveUnit,
    availableUnits: _availableUnits,
}: Props) {
    const [activeUnit, setActiveUnit] = useState<string>(initialActiveUnit);
    const [testingUnit, setTestingUnit] = useState<string | null>(null);
    const [testingAll, setTestingAll] = useState<boolean>(false);
    const [syncingUnit, setSyncingUnit] = useState<string | null>(null);

    // Synchronize Master Data (SD/SMP -> CBT)
    const handleSync = async (unitKey: string = 'all') => {
        setSyncingUnit(unitKey);
        try {
            const res = await fetch('/admin/integrations/sync', {
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
                toast.success('Sinkronisasi Berhasil!', {
                    description: data.message,
                });
                router.reload();
            } else {
                toast.error('Gagal Sinkronisasi', {
                    description: data.message || 'Terjadi kendala saat menyinkronkan data.',
                });
            }
        } catch (err: any) {
            toast.error('Kesalahan Jaringan', { description: err.message });
        } finally {
            setSyncingUnit(null);
        }
    };

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

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload()}
                            className="text-xs font-semibold cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Refresh Status
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTestAll}
                            disabled={testingAll}
                            className="text-xs font-semibold cursor-pointer"
                        >
                            {testingAll ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Menguji...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                                    Uji Semua DB
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleSync('all')}
                            disabled={syncingUnit !== null}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                            {syncingUnit === 'all' ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Menyinkronkan...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                    Tarik & Sinkronkan Semua Data
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
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTestConnection(key)}
                                                disabled={testingUnit === key}
                                                className="text-xs font-semibold cursor-pointer"
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
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSync(key)}
                                                disabled={syncingUnit !== null}
                                                className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                                            >
                                                {syncingUnit === key ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-500" />
                                                        Menyinkronkan...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                                        Tarik Data {u.info.name}
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSwitchUnit(key)}
                                            disabled={isUnitActive}
                                            className={`text-xs font-bold cursor-pointer ${
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

                {/* Architecture & Documentation Card */}
                <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-indigo-500/5 shadow-xs">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 shrink-0 shadow-2xs">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Multi-Database Architecture & Zero Sync Overhead
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                                    Data siswa, rombel, dan guru terhubung langsung dari database master unit masing-masing. Detail data setiap entitas dapat dikelola langsung melalui menu <span className="font-semibold text-slate-700 dark:text-slate-300">Siswa</span>, <span className="font-semibold text-slate-700 dark:text-slate-300">Guru</span>, dan <span className="font-semibold text-slate-700 dark:text-slate-300">Kelas</span>.
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
