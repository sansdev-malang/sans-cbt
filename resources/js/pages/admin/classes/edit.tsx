import { Form, Head, Link } from '@inertiajs/react';
import SchoolClassController from '@/actions/App/Http/Controllers/Admin/SchoolClassController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes/admin';
import { index as classesIndex } from '@/routes/admin/classes';

type TeacherOption = { value: number; label: string };

type SchoolClass = {
    id: number;
    name: string;
    level: string | null;
    academic_year: string;
    homeroom_teacher_id: number | null;
};

export default function AdminClassEdit({
    schoolClass,
    teachers,
}: {
    schoolClass: SchoolClass;
    teachers: TeacherOption[];
}) {
    return (
        <>
            <Head title="Ubah Kelas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Ubah Kelas"
                    description={`Perbarui data kelas ${schoolClass.name} (${schoolClass.academic_year}).`}
                />
                <Card className="max-w-2xl">
                    <CardContent>
                        <Form
                            {...SchoolClassController.update.form(
                                schoolClass.id,
                            )}
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
                                            defaultValue={schoolClass.name}
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="level">Tingkat</Label>
                                        <Input
                                            id="level"
                                            name="level"
                                            maxLength={20}
                                            defaultValue={
                                                schoolClass.level ?? ''
                                            }
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
                                            defaultValue={
                                                schoolClass.academic_year
                                            }
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
                                            defaultValue={
                                                schoolClass.homeroom_teacher_id ===
                                                null
                                                    ? ''
                                                    : String(
                                                          schoolClass.homeroom_teacher_id,
                                                      )
                                            }
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
                                            Simpan Perubahan
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

AdminClassEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Kelas', href: classesIndex() },
        { title: 'Ubah', href: classesIndex() },
    ],
};
