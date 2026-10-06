import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/admin';
import { index as examMonitoringIndex } from '@/routes/admin/exam-monitoring';

type OngoingSession = {
    id: number;
    exam_name: string;
    subject: string;
    student_name: string;
    answered_count: number;
    started_at_label: string;
    remaining_minutes: number;
    violations_count: number;
    flagged: boolean;
};
type ViolationRow = {
    id: number;
    event_type: string;
    level: string;
    user_name: string | null;
    exam_name: string | null;
    created_at_label: string;
};

const LEVEL_VARIANT: Record<string, 'secondary' | 'destructive'> = {
    violation: 'destructive',
    critical: 'destructive',
};

export default function AdminExamMonitoringIndex({
    ongoing,
    recentViolations,
    stats,
}: {
    ongoing: OngoingSession[];
    recentViolations: ViolationRow[];
    stats: { label: string; value: number }[];
}) {
    // Keep the live view fresh without websockets.
    useEffect(() => {
        const timer = setInterval(() => {
            router.reload({ only: ['ongoing', 'recentViolations', 'stats'] });
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title="Monitoring Ujian" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Monitoring Ujian"
                    description="Sesi ujian yang sedang berlangsung dan pelanggaran keamanan terbaru."
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="pt-5 text-center">
                                <p className="text-3xl font-bold">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {stat.label}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base font-medium">
                            <span>Sesi Berjalan</span>
                            <span className="text-xs font-normal text-muted-foreground">
                                Diperbarui otomatis setiap 5 detik
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase">
                                    <th className="py-2 pr-4 font-medium">
                                        Ujian
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Siswa
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Terjawab
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Mulai
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Sisa ±
                                    </th>
                                    <th className="py-2 font-medium">
                                        Pelanggaran
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ongoing.map((session) => (
                                    <tr
                                        key={session.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-3 pr-4">
                                            <p className="font-medium">
                                                {session.exam_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {session.subject}
                                            </p>
                                        </td>
                                        <td className="py-3 pr-4">
                                            {session.student_name}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {session.answered_count}
                                        </td>
                                        <td className="py-3 pr-4 text-muted-foreground">
                                            {session.started_at_label}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {session.remaining_minutes} mnt
                                        </td>
                                        <td className="py-3">
                                            {session.flagged ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="gap-1"
                                                >
                                                    ⚑ {session.violations_count}
                                                </Badge>
                                            ) : session.violations_count > 0 ? (
                                                <Badge variant="secondary">
                                                    {session.violations_count}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {ongoing.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-4 text-center text-muted-foreground"
                                        >
                                            Tidak ada sesi ujian yang sedang
                                            berlangsung.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">
                            Pelanggaran Terbaru
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y rounded-md border">
                            {recentViolations.map((violation) => (
                                <div
                                    key={violation.id}
                                    className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                                >
                                    <div>
                                        <Badge
                                            variant={
                                                LEVEL_VARIANT[
                                                    violation.level
                                                ] ?? 'destructive'
                                            }
                                        >
                                            {violation.event_type}
                                        </Badge>{' '}
                                        <span className="text-muted-foreground">
                                            {violation.user_name ?? '—'} ·{' '}
                                            {violation.exam_name ?? '—'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {violation.created_at_label}
                                    </span>
                                </div>
                            ))}
                            {recentViolations.length === 0 && (
                                <p className="p-3 text-sm text-muted-foreground">
                                    Belum ada pelanggaran tercatat. 👍
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminExamMonitoringIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Monitoring Ujian', href: examMonitoringIndex() },
    ],
};
