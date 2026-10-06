import { Head, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import StudentController from '@/actions/App/Http/Controllers/Admin/StudentController';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
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
    classes,
    users,
}: {
    students: Paginator<Student>;
    filters: { search: string };
    classes: Option[];
    users: Option[];
}) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] =
        useState<StudentFormData | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(
        null,
    );
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            index().url,
            { search },
            { preserveState: true, preserveScroll: true, replace: true },
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
                        description="Data siswa, akun login, dan penempatan kelas."
                    />
                    <Button onClick={openCreateDialog}>Tambah Siswa</Button>
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
                                <tr className="border-b text-left text-xs uppercase">
                                    <th className="py-2 pr-4 font-medium">
                                        Siswa
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        NIS / NISN
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Kelas
                                    </th>
                                    <th className="py-2 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.data.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-3 pr-4 font-medium">
                                            {student.full_name}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {student.nis}
                                            {student.nisn && (
                                                <span className="block text-muted-foreground">
                                                    {student.nisn}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {student.classes.join(', ') ||
                                                'Belum ditempatkan'}
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
                                ))}
                            </tbody>
                        </table>
                        <AdminPagination
                            paginator={students}
                            itemLabel="siswa"
                            onPageChange={(page) =>
                                router.get(
                                    index().url,
                                    { search, page },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
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
