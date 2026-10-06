import { Head } from '@inertiajs/react';
import StudentController from '@/actions/App/Http/Controllers/Admin/StudentController';
import Heading from '@/components/heading';
import { StudentForm } from './form';
import { dashboard } from '@/routes/admin';
import { index } from '@/routes/admin/students';

type Option = { value: number; label: string };
type Student = {
    id: number;
    user_id: number | null;
    nis: string;
    nisn: string | null;
    full_name: string;
    gender: string | null;
    birth_date: string | null;
    phone: string | null;
    address: string | null;
    class_ids: number[];
};
export default function AdminStudentEdit({
    student,
    classes,
    users,
}: {
    student: Student;
    classes: Option[];
    users: Option[];
}) {
    return (
        <>
            <Head title="Ubah Siswa" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Ubah Siswa"
                    description={`Perbarui profil ${student.full_name}.`}
                />
                <StudentForm
                    action={StudentController.update.form(student.id)}
                    student={student}
                    classes={classes}
                    users={users}
                />
            </div>
        </>
    );
}
AdminStudentEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Siswa', href: index() },
        { title: 'Ubah', href: index() },
    ],
};
