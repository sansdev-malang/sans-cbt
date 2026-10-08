import { Head, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import TeacherController from '@/actions/App/Http/Controllers/Admin/TeacherController';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { TeacherFormDialog } from '@/components/admin/teacher-form-dialog';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { UnitBadge } from '@/components/admin/unit-badge';
import { UnitFilterTabs } from '@/components/admin/unit-filter-tabs';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes/admin';
import { index } from '@/routes/admin/teachers';

type Teacher = {
    id: number;
    unit?: 'sd' | 'smp' | string;
    user_id: number | null;
    nip: string | null;
    full_name: string;
    phone: string | null;
    homeroom_classes: string[];
};
type Option = { value: number; label: string };
type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export default function AdminTeachersIndex({
    teachers,
    filters,
    unitCounts,
    users,
}: {
    teachers: Paginator<Teacher>;
    filters: { search: string; unit?: string };
    unitCounts?: { all?: number; sd?: number; smp?: number };
    users: Option[];
}) {
    const [search, setSearch] = useState(filters.search);
    const activeUnit = filters.unit || 'all';
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(
        null,
    );
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(
        null,
    );

    const handleUnitChange = (unit: 'all' | 'sd' | 'smp') => {
        router.get(
            index().url,
            { search, unit },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            index().url,
            { search, unit: activeUnit },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };
    const openCreateDialog = () => {
        setSelectedTeacher(null);
        setDialogOpen(true);
    };
    const openEditDialog = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setDialogOpen(true);
    };
    const destroy = () => {
        if (teacherToDelete)
            router.delete(TeacherController.destroy.url(teacherToDelete.id), {
                preserveScroll: true,
                onSuccess: () => setTeacherToDelete(null),
            });
    };

    return (
        <>
            <Head title="Kelola Guru" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Kelola Guru"
                        description="Data guru, NIP, unit sekolah, dan penugasan wali kelas."
                    />
                    <Button onClick={openCreateDialog}>Tambah Guru</Button>
                </div>
                <Card>
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <UnitFilterTabs
                            activeUnit={activeUnit}
                            counts={unitCounts}
                            onChange={handleUnitChange}
                        />
                        <form
                            onSubmit={submit}
                            className="flex w-full max-w-sm gap-2"
                        >
                            <Input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari nama atau NIP..."
                            />
                            <Button type="submit" variant="outline">
                                Cari
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                                    <th className="py-2.5 pr-4 font-medium">
                                        Unit
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        Guru
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        NIP
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        Wali Kelas
                                    </th>
                                    <th className="py-2.5 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data guru ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    teachers.data.map((teacher) => (
                                        <tr
                                            key={teacher.id}
                                            className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                                        >
                                            <td className="py-3 pr-4">
                                                <UnitBadge unit={teacher.unit} />
                                            </td>
                                            <td className="py-3 pr-4 font-medium">
                                                <div className="font-semibold text-foreground">
                                                    {teacher.full_name}
                                                </div>
                                                {teacher.phone && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        {teacher.phone}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">
                                                {teacher.nip ?? '-'}
                                            </td>
                                            <td className="py-3 pr-4">
                                                {teacher.homeroom_classes.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {teacher.homeroom_classes.map((cls, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded bg-muted px-2 py-0.5 text-xs text-foreground"
                                                            >
                                                                {cls}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditDialog(teacher)
                                                        }
                                                    >
                                                        Ubah
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setTeacherToDelete(
                                                                teacher,
                                                            )
                                                        }
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <AdminPagination
                            paginator={teachers}
                            itemLabel="guru"
                            onPageChange={(page) =>
                                router.get(
                                    index().url,
                                    { search, unit: activeUnit, page },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                        />
                    </CardContent>
                </Card>
                <TeacherFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    teacher={selectedTeacher}
                    users={users}
                />
                <DeleteConfirmationDialog
                    open={teacherToDelete !== null}
                    onOpenChange={(open) => !open && setTeacherToDelete(null)}
                    itemName={teacherToDelete?.full_name ?? null}
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

AdminTeachersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Guru', href: index() },
    ],
};
