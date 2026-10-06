import { Head, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import SubjectController from '@/actions/App/Http/Controllers/Admin/SubjectController';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { SubjectFormDialog } from '@/components/admin/subject-form-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes/admin';
import { index as subjectsIndex } from '@/routes/admin/subjects';

type AdminSubject = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export default function AdminSubjectsIndex({
    subjects,
    filters,
}: {
    subjects: Paginator<AdminSubject>;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<AdminSubject | null>(
        null,
    );
    const [subjectToDelete, setSubjectToDelete] = useState<AdminSubject | null>(
        null,
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            subjectsIndex().url,
            { search },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            subjectsIndex().url,
            { search, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const destroy = () => {
        if (!subjectToDelete) return;
        router.delete(SubjectController.destroy.url(subjectToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setSubjectToDelete(null),
        });
    };

    const openCreateDialog = () => {
        setSelectedSubject(null);
        setDialogOpen(true);
    };
    const openEditDialog = (subject: AdminSubject) => {
        setSelectedSubject(subject);
        setDialogOpen(true);
    };

    return (
        <>
            <Head title="Kelola Mata Pelajaran" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Kelola Mata Pelajaran"
                        description="Daftar mapel untuk bank soal dan ujian."
                    />
                    <Button onClick={openCreateDialog}>Tambah</Button>
                </div>
                <Card>
                    <CardHeader>
                        <form
                            onSubmit={submit}
                            className="flex w-full max-w-md gap-2"
                        >
                            <Input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode atau nama..."
                            />
                            <Button type="submit" variant="outline">
                                Cari
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase">
                                    <th className="py-2 pr-4 font-medium">
                                        Kode
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Nama
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
                                {subjects.data.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-3 pr-4 font-medium">
                                            {s.code}
                                        </td>
                                        <td className="py-3 pr-4">{s.name}</td>
                                        <td className="py-3 pr-4">
                                            <Badge
                                                variant={
                                                    s.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {s.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEditDialog(s)
                                                    }
                                                >
                                                    Ubah
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSubjectToDelete(s)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <AdminPagination
                            paginator={subjects}
                            itemLabel="mata pelajaran"
                            onPageChange={goToPage}
                        />
                    </CardContent>
                </Card>
                <SubjectFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    subject={selectedSubject}
                />
                <DeleteConfirmationDialog
                    open={subjectToDelete !== null}
                    onOpenChange={(open) => !open && setSubjectToDelete(null)}
                    itemName={
                        subjectToDelete
                            ? `${subjectToDelete.name} (${subjectToDelete.code})`
                            : null
                    }
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

AdminSubjectsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Mata Pelajaran', href: subjectsIndex() },
    ],
};
