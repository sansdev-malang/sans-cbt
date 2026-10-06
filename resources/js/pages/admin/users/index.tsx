import { Head, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { UserFormDialog } from '@/components/admin/user-form-dialog';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes/admin';
import { index as usersIndex } from '@/routes/admin/users';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    role_label: string;
    email_verified_at: string | null;
    created_at: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Props = {
    users: Paginator<AdminUser>;
    filters: {
        search: string;
    };
    roles: { value: string; label: string }[];
};

export default function AdminUsersIndex({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            usersIndex().url,
            { search },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            usersIndex().url,
            { search, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openCreateDialog = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };
    const openEditDialog = (user: AdminUser) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };
    const destroy = () => {
        if (!userToDelete) return;

        router.delete(UserController.destroy.url(userToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setUserToDelete(null),
        });
    };

    return (
        <>
            <Head title="Kelola Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Kelola Pengguna"
                        description="Daftar akun Admin, Guru, Siswa, dan Orang Tua."
                    />
                    <Button onClick={openCreateDialog}>Tambah Pengguna</Button>
                </div>

                <Card>
                    <CardHeader>
                        <form
                            onSubmit={submit}
                            className="flex w-full max-w-md items-center gap-2"
                        >
                            <Input
                                type="search"
                                name="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari nama atau email..."
                            />
                            <Button type="submit" variant="outline">
                                Cari
                            </Button>
                        </form>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                                    <th className="py-2 pr-4 font-medium">
                                        Nama
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Email
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Peran
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Status
                                    </th>
                                    <th className="py-2 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-border/60 last:border-0"
                                    >
                                        <td className="py-3 pr-4 font-medium">
                                            {user.name}
                                        </td>
                                        <td className="py-3 pr-4 text-muted-foreground">
                                            {user.email}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="rounded-md border border-border px-2 py-0.5 text-xs">
                                                {user.role_label}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-muted-foreground">
                                            {user.email_verified_at
                                                ? 'Terverifikasi'
                                                : 'Belum verifikasi'}
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEditDialog(user)
                                                    }
                                                >
                                                    Ubah
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        setUserToDelete(user)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {users.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada pengguna yang cocok dengan
                                            pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                            <p className="text-xs text-muted-foreground">
                                {users.total > 0
                                    ? `Menampilkan ${users.from}–${users.to} dari ${users.total} pengguna`
                                    : 'Tidak ada data'}
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={users.current_page <= 1}
                                    onClick={() =>
                                        goToPage(users.current_page - 1)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Halaman {users.current_page} dari{' '}
                                    {users.last_page}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        users.current_page >= users.last_page
                                    }
                                    onClick={() =>
                                        goToPage(users.current_page + 1)
                                    }
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <UserFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    user={selectedUser}
                    roles={roles}
                />
                <DeleteConfirmationDialog
                    open={userToDelete !== null}
                    onOpenChange={(open) => !open && setUserToDelete(null)}
                    itemName={userToDelete?.name ?? null}
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

AdminUsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Admin',
            href: dashboard(),
        },
        {
            title: 'Kelola Pengguna',
            href: usersIndex(),
        },
    ],
};
