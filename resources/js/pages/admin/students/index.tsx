import { Head, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import StudentController from '@/actions/App/Http/Controllers/Admin/StudentController';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { UnitBadge } from '@/components/admin/unit-badge';
import { UnitFilterTabs } from '@/components/admin/unit-filter-tabs';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StudentForm } from './form';
import { dashboard } from '@/routes/admin';
import { index } from '@/routes/admin/students';

type Student = {
    id: number;
    unit?: 'sd' | 'smp' | string;
    nis: string;
    nisn: string | null;
    full_name: string;
    gender: string | null;
    user_id: number | null;
    birth_date: string | null;
    phone: string | null;
    address: string | null;
    class_ids: number[];
    classes: string[];
};
type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};
type Option = { value: number; label: string };
type StudentFormData = Student;

export default function AdminStudentsIndex({
    students,
    filters,
    unitCounts,
    classes,
    users,
}: {
    students: Paginator<Student>;
    filters: { search: string; unit?: string; class_id?: number };
    unitCounts?: { all?: number; sd?: number; smp?: number };
    classes: Option[];
    users: Option[];
}) {
    const [search, setSearch] = useState(filters.search);
    const activeUnit = filters.unit || 'all';
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] =
        useState<StudentFormData | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(
        null,
    );

    const handleUnitChange = (unit: 'all' | 'sd' | 'smp') => {
        router.get(
            index().url,
            { search, unit, class_id: filters.class_id },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            index().url,
            { search, unit: activeUnit, class_id: filters.class_id },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            index().url,
            { search, unit: activeUnit, class_id: filters.class_id, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const destroy = () => {
        if (studentToDelete)
            router.delete(StudentController.destroy.url(studentToDelete.id), {
                preserveScroll: true,
                onSuccess: () => setStudentToDelete(null),
            });
    };
    const openCreateDialog = () => {
        setSelectedStudent(null);
        setDialogOpen(true);
    };
    const openEditDialog = (student: Student) => {
        setSelectedStudent(student);
        setDialogOpen(true);
    };
    const emptyStudent: StudentFormData = {
        id: 0,
        unit: activeUnit !== 'all' ? activeUnit : 'sd',
        user_id: null,
        nis: '',
        nisn: null,
        full_name: '',
        gender: null,
        birth_date: null,
        phone: null,
        address: null,
        class_ids: [],
        classes: [],
    };

    return (
        <>
            <Head title="Kelola Siswa" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Kelola Siswa"
                        description="Data siswa unit SD dan SMP, akun login, dan rombel kelas."
                    />
                    <Button onClick={openCreateDialog}>Tambah Siswa</Button>
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
                                placeholder="Cari nama, NIS, atau NISN..."
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
                                        Siswa
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        NIS / NISN
                                    </th>
                                    <th className="py-2.5 pr-4 font-medium">
                                        Kelas
                                    </th>
                                    <th className="py-2.5 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data siswa ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                                        >
                                            <td className="py-3 pr-4">
                                                <UnitBadge unit={student.unit} />
                                            </td>
                                            <td className="py-3 pr-4 font-medium">
                                                <div className="font-semibold text-foreground">
                                                    {student.full_name}
                                                </div>
                                                {student.gender && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">
                                                <div>{student.nis}</div>
                                                {student.nisn && (
                                                    <div className="text-[11px] opacity-75">
                                                        NISN: {student.nisn}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4">
                                                {student.classes.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {student.classes.map((cls, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded bg-muted px-2 py-0.5 text-xs text-foreground"
                                                            >
                                                                {cls}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Belum ditempatkan
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditDialog(student)
                                                        }
                                                    >
                                                        Ubah
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setStudentToDelete(
                                                                student,
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
                            paginator={students}
                            itemLabel="siswa"
                            onPageChange={goToPage}
                        />
                    </CardContent>
                </Card>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedStudent
                                    ? 'Ubah Siswa'
                                    : 'Tambah Siswa'}
                            </DialogTitle>
                            <DialogDescription>
                                Isi profil siswa dan penempatan kelas.
                            </DialogDescription>
                        </DialogHeader>
                        <StudentForm
                            action={
                                selectedStudent
                                    ? StudentController.update.form(
                                          selectedStudent.id,
                                      )
                                    : StudentController.store.form()
                            }
                            student={selectedStudent ?? emptyStudent}
                            classes={classes}
                            users={users}
                            onSuccess={() => setDialogOpen(false)}
                            onCancel={() => setDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
                <DeleteConfirmationDialog
                    open={studentToDelete !== null}
                    onOpenChange={(open) => !open && setStudentToDelete(null)}
                    itemName={studentToDelete?.full_name ?? null}
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

AdminStudentsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Siswa', href: index() },
    ],
};
