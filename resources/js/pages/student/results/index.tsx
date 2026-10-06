import { Head, Link } from '@inertiajs/react';
import { Award, CalendarCheck, ClipboardCheck, TrendingUp } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    index as studentExamsIndex,
    result as sessionResult,
} from '@/routes/student/exams';
import { index as studentResultsIndex } from '@/routes/student/results';

type Row = {
    id: number;
    exam_name: string;
    subject: string;
    submitted_at_label: string;
    status: string;
    score: number | null;
    has_essay_pending: boolean;
};

const STATUS_LABELS: Record<string, string> = {
    submitted: 'Dikumpulkan',
    expired: 'Waktu Habis',
};

const STATUS_VARIANT: Record<string, 'secondary' | 'outline'> = {
    submitted: 'secondary',
    expired: 'outline',
};

export default function StudentResults({ results }: { results: Row[] }) {
    const stats = useMemo(() => {
        const scores = results
            .filter((row) => row.score !== null && !row.has_essay_pending)
            .map((row) => row.score as number);
        const average =
            scores.length > 0
                ? Math.round(
                      scores.reduce((sum, score) => sum + score, 0) /
                          scores.length,
                  )
                : null;
        return {
            taken: results.length,
            average,
            best: scores.length > 0 ? Math.max(...scores) : null,
        };
    }, [results]);

    return (
        <>
            <Head title="Riwayat Nilai" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <Heading
                    title="Riwayat Nilai"
                    description="Rekap ujian yang sudah kamu kerjakan. Klik nama ujian untuk melihat rincian jawaban."
                />

                {results.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <CalendarCheck className="size-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">
                                Belum ada riwayat ujian
                            </h3>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Ujian yang sudah kamu kumpulkan akan tampil di
                                sini beserta nilainya.
                            </p>
                            <Button asChild>
                                <Link href={studentExamsIndex().url}>
                                    Lihat Ujian Saya
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard
                                icon={<ClipboardCheck className="size-5" />}
                                value={stats.taken.toString()}
                                label="Ujian Dikerjakan"
                                hint="total ujian yang sudah dikumpulkan"
                            />
                            <StatCard
                                icon={<TrendingUp className="size-5" />}
                                value={
                                    stats.average !== null
                                        ? stats.average.toString()
                                        : '—'
                                }
                                label="Rata-rata Nilai"
                                hint="dari nilai yang sudah diumumkan"
                            />
                            <StatCard
                                icon={<Award className="size-5" />}
                                value={
                                    stats.best !== null
                                        ? stats.best.toString()
                                        : '—'
                                }
                                label="Nilai Terbaik"
                                hint="nilai tertinggi sejauh ini"
                            />
                        </div>

                        <Card className="gap-0 py-0">
                            <CardContent className="overflow-x-auto px-0 pb-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                                            <th className="px-6 py-3 font-medium">
                                                Ujian
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Mapel
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Waktu
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Nilai
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b transition-colors last:border-0 hover:bg-muted/40"
                                            >
                                                <td className="px-6 py-3.5 font-medium">
                                                    <Link
                                                        href={sessionResult.url(
                                                            row.id,
                                                        )}
                                                        className="hover:underline"
                                                    >
                                                        {row.exam_name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {row.subject}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {row.submitted_at_label}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Badge
                                                        variant={
                                                            STATUS_VARIANT[
                                                                row.status
                                                            ] ?? 'secondary'
                                                        }
                                                        className="font-normal"
                                                    >
                                                        {STATUS_LABELS[
                                                            row.status
                                                        ] ?? row.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {row.has_essay_pending ? (
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            Menunggu esai
                                                        </span>
                                                    ) : row.score !== null ? (
                                                        <span className="font-semibold">
                                                            {row.score}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Belum diumumkan
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5 text-right whitespace-nowrap">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="ghost"
                                                    >
                                                        <Link
                                                            href={sessionResult.url(
                                                                row.id,
                                                            )}
                                                        >
                                                            Detail
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

function StatCard({
    icon,
    value,
    label,
    hint,
}: {
    icon: ReactNode;
    value: string;
    label: string;
    hint: string;
}) {
    return (
        <Card className="gap-0 py-0">
            <CardContent className="flex items-center gap-3 px-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-2xl leading-none font-semibold">
                        {value}
                    </p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
            </CardContent>
        </Card>
    );
}

StudentResults.layout = {
    breadcrumbs: [{ title: 'Riwayat Nilai', href: studentResultsIndex() }],
};
