import { Head } from '@inertiajs/react';
import StudentController from '@/actions/App/Http/Controllers/Admin/StudentController';
import Heading from '@/components/heading';
import { StudentForm } from './form';
import { dashboard } from '@/routes/admin';
import { create, index } from '@/routes/admin/students';

type Option = { value: number; label: string };
export default function AdminStudentCreate({
    classes,
    users,
}: {
    classes: Option[];
    users: Option[];
}) {
    return (
        <>
            <Head title="Tambah Siswa" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Tambah Siswa"
                    description="Masukkan profil siswa dan kelasnya."
                />
                <StudentForm
                    action={StudentController.store.form()}
                    student={{
                        user_id: null,
                        nis: '',
                        nisn: null,
                        full_name: '',
                        gender: null,
                        birth_date: null,
                        phone: null,
                        address: null,
                        class_ids: [],
                    }}
                    classes={classes}
                    users={users}
                />
            </div>
        </>
    );
}
AdminStudentCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Siswa', href: index() },
        { title: 'Tambah', href: create() },
    ],
};
