import { Head, router } from "@inertiajs/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { dashboard } from "@/routes/admin";
import { index as auditLogsIndex, purge as auditLogsPurge } from "@/routes/admin/audit-logs";

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
type RetentionOption = {
    days: number;
    label: string;
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
    total_count,
    retention_options,
}: {
    logs: Paginator<LogRow>;
    levels: string[];
    eventTypes: string[];
    filters: { level: string; event: string };
    total_count: number;
    retention_options: RetentionOption[];
}) {
    const [level, setLevel] = useState(filters.level);
    const [event, setEvent] = useState(filters.event);
    const [purgeOpen, setPurgeOpen] = useState(false);
    const [selectedDays, setSelectedDays] = useState<number>(30);
    const [purging, setPurging] = useState(false);

    const applyFilter = (nextLevel: string, nextEvent: string) => {
        router.get(
            auditLogsIndex().url,
            { level: nextLevel, event: nextEvent },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handlePurge = () => {
        setPurging(true);
        router.delete(auditLogsPurge().url, {
            data: { days: selectedDays },
            onFinish: () => {
                setPurging(false);
                setPurgeOpen(false);
            },
        });
    };

    const selectedOption = retention_options.find((o) => o.days === selectedDays);
    const purgeDescription =
        selectedDays === 0
            ? "Semua audit log (kecuali log sesi ujian yang masih berlangsung) akan dihapus permanen."
            : `Audit log yang dibuat lebih dari ${selectedDays} hari yang lalu akan dihapus permanen.`;

    return (
        <>
            <Head title="Audit Log" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Audit Log"
                        description="Jejak aktivitas penting dan pelanggaran keamanan pada sistem CBT."
                    />

                    <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                            >
                                <Trash2 className="size-4" />
                                Bersihkan Log
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Bersihkan Audit Log</DialogTitle>
                                <DialogDescription>
                                    Pilih periode retensi. Log yang terkait sesi
                                    ujian yang sedang berlangsung{" "}
                                    <strong>tidak akan dihapus</strong>.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-2">
                                {/* Total count info */}
                                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
                                    <span>
                                        Total log saat ini:{" "}
                                        <strong>{total_count.toLocaleString("id-ID")}</strong>{" "}
                                        entri
                                    </span>
                                </div>

                                {/* Retention options */}
                                <div className="grid gap-2">
                                    <p className="text-sm font-medium">
                                        Hapus log:
                                    </p>
                                    <div className="grid gap-2">
                                        {retention_options.map((option) => (
                                            <label
                                                key={option.days}
                                                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                                                    selectedDays === option.days
                                                        ? "border-red-400 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
                                                        : "border-border hover:bg-muted"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="retention"
                                                    value={option.days}
                                                    checked={selectedDays === option.days}
                                                    onChange={() => setSelectedDays(option.days)}
                                                    className="accent-red-600"
                                                />
                                                {option.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Warning message */}
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                                    ⚠️ {purgeDescription} Tindakan ini{" "}
                                    <strong>tidak dapat dibatalkan</strong>.
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setPurgeOpen(false)}
                                    disabled={purging}
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handlePurge}
                                    disabled={purging}
                                    className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                                >
                                    {purging ? "Menghapus…" : `Hapus — ${selectedOption?.label ?? ""}`}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

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
