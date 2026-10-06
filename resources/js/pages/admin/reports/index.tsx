import { Head, Link } from "@inertiajs/react";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboard } from "@/routes/admin";
import { index as reportsIndex } from "@/routes/admin/reports";

type Row = {
    id: number;
    name: string;
    teacher: string | null;
    subject: string;
    class: string;
    questions_count: number;
    submitted_count: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
    is_published: boolean;
};

export default function AdminReportsIndex({
    stats,
    rows,
    recentViolations,
}: {
    stats: { label: string; value: number | string | null }[];
    rows: Row[];
    recentViolations: {
        id: number;
        event_type: string;
        user_name: string | null;
        created_at_label: string;
    }[];
}) {
    return (
        <>
            <Head title="Hasil & Laporan" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Hasil & Laporan"
                    description="Rekap nilai seluruh ujian di sekolah."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="pt-5 text-center">
                                <p className="text-3xl font-bold">
                                    {stat.value ?? "—"}
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
                        <CardTitle className="text-base font-medium">
                            Rekap Ujian
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
                                        Guru
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Kelas
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Soal
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Dikumpulkan
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Rata-rata
                                    </th>
                                    <th className="py-2 font-medium">
                                        Tertinggi / Terendah
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-2.5 pr-4">
                                            <p className="font-medium">
                                                {row.name}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground">
                                                    {row.subject}
                                                </span>
                                                {!row.is_published && (
                                                    <Badge variant="secondary">
                                                        Draft
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            {row.teacher ?? "—"}
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            {row.class}
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            {row.questions_count}
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            {row.submitted_count}
                                        </td>
                                        <td className="py-2.5 pr-4 font-semibold">
                                            {row.average ?? "—"}
                                        </td>
                                        <td className="py-2.5 text-muted-foreground">
                                            {row.highest ?? "—"} /{" "}
                                            {row.lowest ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-4 text-center text-muted-foreground"
                                        >
                                            Belum ada ujian yang dibuat.
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
                                    className="flex items-center justify-between gap-2 p-3 text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive">
                                            {violation.event_type}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                            {violation.user_name ?? "—"}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {violation.created_at_label}
                                    </span>
                                </div>
                            ))}
                            {recentViolations.length === 0 && (
                                <p className="p-3 text-sm text-muted-foreground">
                                    Tidak ada pelanggaran tercatat.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminReportsIndex.layout = {
    breadcrumbs: [
        { title: "Dashboard Admin", href: dashboard() },
        { title: "Hasil & Laporan", href: reportsIndex() },
    ],
};
