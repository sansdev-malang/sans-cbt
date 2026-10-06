import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes/admin';

type Stat = {
    label: string;
    value: number;
};

type RecentUser = {
    id: number;
    name: string;
    email: string;
    role_label: string;
};

export default function AdminDashboard({
    stats,
    recentUsers,
}: {
    stats: Stat[];
    recentUsers: RecentUser[];
}) {
    return (
        <>
            <Head title="Dashboard Admin" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Dashboard Admin"
                    description="Ringkasan pengguna dan aktivitas sistem CBT."
                />

                <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="gap-1 py-5">
                            <CardHeader className="gap-1">
                                <CardDescription>{stat.label}</CardDescription>
                                <CardTitle className="text-2xl tabular-nums">
                                    {stat.value}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengguna Terbaru</CardTitle>
                        <CardDescription>
                            Lima akun terakhir yang ditambahkan ke sistem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y divide-border">
                            {recentUsers.map((user) => (
                                <li
                                    key={user.id}
                                    className="flex items-center justify-between gap-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                        {user.role_label}
                                    </span>
                                </li>
                            ))}

                            {recentUsers.length === 0 && (
                                <li className="py-6 text-center text-sm text-muted-foreground">
                                    Belum ada pengguna.
                                </li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Admin',
            href: dashboard(),
        },
    ],
};
