import { Head } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { dashboard } from '@/routes/admin';
import { index as peopleIndex } from '@/routes/admin/people';

export default function AdminPeopleIndex() {
    return (
        <>
            <Head title="Guru & Siswa" />

            <ModulePlaceholder
                icon={Users}
                title="Guru & Siswa"
                description="Kelola data induk guru dan siswa beserta Nomor Induk."
                plannedItems={[
                    'Data guru dan NIP',
                    'Data siswa dan NIS/NISN',
                    'Penempatan kelas siswa',
                    'Akun login (pembuatan & reset)',
                ]}
            />
        </>
    );
}

AdminPeopleIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Guru & Siswa', href: peopleIndex() },
    ],
};
