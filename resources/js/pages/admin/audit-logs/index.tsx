import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dashboard } from "@/routes/admin";
import { index as auditLogsIndex } from "@/routes/admin/audit-logs";

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};
type LogRow = {
    id: number;
    event_type: string;
    level: string;
    user_name: string | null;
    exam_name: string | null;
    exam_session_id: number | null;
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    created_at_label: string;
};

const LEVEL_VARIANT: Record<
    string,
    "secondary" | "default" | "destructive" | "outline"
> = {
    info: "secondary",
    warning: "default",
    violation: "destructive",
    critical: "destructive",
};

export default function AdminAuditLogsIndex({
    logs,
    levels,
    eventTypes,
    filters,
}: {
    logs: Paginator<LogRow>;
    levels: string[];
    eventTypes: string[];
    filters: { level: string; event: string };
}) {
    const [level, setLevel] = useState(filters.level);
    const [event, setEvent] = useState(filters.event);

    const applyFilter = (nextLevel: string, nextEvent: string) => {
        router.get(
            auditLogsIndex().url,
            { level: nextLevel, event: nextEvent },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Audit Log" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Audit Log"
                    description="Jejak aktivitas penting dan pelanggaran keamanan pada sistem CBT."
                />

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap gap-3">
                            <select
                                aria-label="Filter level"
                                value={level}
                                onChange={(e) => {
                                    setLevel(e.target.value);
                                    applyFilter(e.target.value, event);
                                }}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Semua level</option>
                                {levels.map((value) => (
                                    <option key={value} value={value}>
                                        {value.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Filter jenis event"
                                value={event}
                                onChange={(e) => {
                                    setEvent(e.target.value);
                                    applyFilter(level, e.target.value);
                                }}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Semua event</option>
                                {eventTypes.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase">
                                    <th className="py-2 pr-4 font-medium">
                                        Waktu
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Level
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Event
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Pengguna
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Ujian
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Detail
                                    </th>
                                    <th className="py-2 font-medium">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b align-top last:border-0"
                                    >
                                        <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                                            {log.created_at_label}
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <Badge
                                                variant={
                                                    LEVEL_VARIANT[log.level] ??
                                                    "secondary"
                                                }
                                            >
                                                {log.level.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 pr-4 font-medium">
                                            {log.event_type}
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            {log.user_name ?? "—"}
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            {log.exam_name ?? "—"}
                                        </td>
                                        <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                                            {log.metadata
                                                ? JSON.stringify(log.metadata)
                                                : "—"}
                                        </td>
                                        <td className="py-2.5 text-xs text-muted-foreground">
                                            {log.ip_address ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-4 text-center text-muted-foreground"
                                        >
                                            Tidak ada log yang cocok dengan
                                            filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <AdminPagination
                            paginator={logs}
                            itemLabel="log"
                            onPageChange={(page) =>
                                router.get(
                                    auditLogsIndex().url,
                                    { level, event, page },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminAuditLogsIndex.layout = {
    breadcrumbs: [
        { title: "Dashboard Admin", href: dashboard() },
        { title: "Audit Log", href: auditLogsIndex() },
    ],
};
