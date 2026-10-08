import { Head, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import SchoolClassController from '@/actions/App/Http/Controllers/Admin/SchoolClassController';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { SchoolClassFormDialog } from '@/components/admin/school-class-form-dialog';
import { UnitBadge } from '@/components/admin/unit-badge';
import { UnitFilterTabs } from '@/components/admin/unit-filter-tabs';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes/admin';
import { index as classesIndex } from '@/routes/admin/classes';

type AdminSchoolClass = {
    id: number;
    unit?: 'sd' | 'smp' | string;
    name: string;
    level: string | null;
    academic_year: string;
    homeroom_teacher: string | null;
    homeroom_teacher_id?: number | null;
    students_count: number;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export default function AdminClassesIndex({
    classes,
    filters,
    unitCounts,
    teachers,
}: {
    classes: Paginator<AdminSchoolClass>;
    filters: { search: string; unit?: string };
    unitCounts?: { all?: number; sd?: number; smp?: number };
    teachers: { value: number; label: string }[];
}) {
    const [search, setSearch] = useState(filters.search);
    const activeUnit = filters.unit || 'all';
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<AdminSchoolClass | null>(
        null,
    );
    const [classToDelete, setClassToDelete] = useState<AdminSchoolClass | null>(
        null,
    );

    const handleUnitChange = (unit: 'all' | 'sd' | 'smp') => {
        router.get(
            classesIndex().url,
            { search, unit },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            classesIndex().url,
            { search, unit: activeUnit },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            classesIndex().url,
            { search, unit: activeUnit, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const destroy = () => {
        if (!classToDelete) return;
        router.delete(SchoolClassController.destroy.url(classToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setClassToDelete(null),
        });
    };

    const openCreateDialog = () => {
        setSelectedClass(null);
        setDialogOpen(true);
    };
    const openEditDialog = (schoolClass: AdminSchoolClass) => {
        setSelectedClass(schoolClass);
        setDialogOpen(true);
    };

    return (
        <>
            <Head title="Kelola Kelas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Kelola Kelas"
                        description="Daftar rombel peserta ujian untuk unit SD dan SMP."
                    />
                    <Button onClick={openCreateDialog}>Tambah Kelas</Button>
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
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau tahun ajaran..."
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
                                        Kelas
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        Tingkat
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        Tahun Ajaran
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        Wali Kelas
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        Siswa
                                    </th>
                                    <th className="py-2.5 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data kelas ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    classes.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                                        >
                                            <td className="py-3 pr-4">
                                                <UnitBadge unit={item.unit} />
                                            </td>
                                            <td className="py-3 pr-4 font-medium text-foreground">
                                                {item.name}
                                            </td>
                                            <td className="py-3 pr-4 text-muted-foreground">
                                                {item.level ?? '-'}
                                            </td>
                                            <td className="py-3 pr-4 text-muted-foreground">
                                                {item.academic_year}
                                            </td>
                                            <td className="py-3 pr-4 text-muted-foreground">
                                                {item.homeroom_teacher ?? '-'}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                                                    {item.students_count} siswa
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditDialog(item)
                                                        }
                                                    >
                                                        Ubah
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setClassToDelete(item)
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
                            paginator={classes}
                            itemLabel="kelas"
                            onPageChange={goToPage}
                        />
                    </CardContent>
                </Card>
                <SchoolClassFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    schoolClass={selectedClass}
                    teachers={teachers}
                />
                <DeleteConfirmationDialog
                    open={classToDelete !== null}
                    onOpenChange={(open) => !open && setClassToDelete(null)}
                    itemName={classToDelete?.name ?? null}
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

AdminClassesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Kelas', href: classesIndex() },
    ],
};
