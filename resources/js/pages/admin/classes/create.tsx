import { Form, Head, Link } from '@inertiajs/react';
import SchoolClassController from '@/actions/App/Http/Controllers/Admin/SchoolClassController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes/admin';
import {
    create as classesCreate,
    index as classesIndex,
} from '@/routes/admin/classes';

type TeacherOption = { value: number; label: string };

export default function AdminClassCreate({
    teachers,
}: {
    teachers: TeacherOption[];
}) {
    return (
        <>
            <Head title="Tambah Kelas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Tambah Kelas"
                    description="Isi nama, tahun ajaran, dan wali kelas."
                />
                <Card className="max-w-2xl">
                    <CardContent>
                        <Form
                            {...SchoolClassController.store.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            maxLength={50}
                                            placeholder="cth: 1A"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="level">Tingkat</Label>
                                        <Input
                                            id="level"
                                            name="level"
                                            maxLength={20}
                                            placeholder="cth: 1 (opsional)"
                                        />
                                        <InputError message={errors.level} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="academic_year">
                                            Tahun Ajaran
                                        </Label>
                                        <Input
                                            id="academic_year"
                                            name="academic_year"
                                            required
                                            maxLength={20}
                                            placeholder="cth: 2026/2027"
                                        />
                                        <InputError
                                            message={errors.academic_year}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wali">Wali Kelas</Label>
                                        <select
                                            id="wali"
                                            name="homeroom_teacher_id"
                                            defaultValue=""
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                                        >
                                            <option value="">
                                                Tanpa wali kelas
                                            </option>
                                            {teachers.map((t) => (
                                                <option
                                                    key={t.value}
                                                    value={String(t.value)}
                                                >
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.homeroom_teacher_id}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button disabled={processing}>
                                            Simpan
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <Link href={classesIndex().url}>
                                                Batal
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminClassCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Kelas', href: classesIndex() },
        { title: 'Tambah', href: classesCreate() },
    ],
};
