import { Form, Head, Link } from '@inertiajs/react';
import SubjectController from '@/actions/App/Http/Controllers/Admin/SubjectController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes/admin';
import {
    create as subjectsCreate,
    index as subjectsIndex,
} from '@/routes/admin/subjects';

export default function AdminSubjectCreate() {
    return (
        <>
            <Head title="Tambah Mata Pelajaran" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Tambah Mata Pelajaran"
                    description="Isi kode, nama, dan status mata pelajaran."
                />
                <Card className="max-w-2xl">
                    <CardContent>
                        <Form
                            {...SubjectController.store.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Kode</Label>
                                        <Input
                                            id="code"
                                            name="code"
                                            required
                                            maxLength={20}
                                            placeholder="cth: MTK"
                                        />
                                        <InputError message={errors.code} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            maxLength={255}
                                            placeholder="cth: Matematika"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">
                                            Deskripsi
                                        </Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={3}
                                            placeholder="Keterangan singkat (opsional)"
                                            className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>
                                    <label
                                        htmlFor="is_active"
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="hidden"
                                            name="is_active"
                                            value="0"
                                        />
                                        <input
                                            id="is_active"
                                            name="is_active"
                                            type="checkbox"
                                            value="1"
                                            defaultChecked
                                            className="size-4 shrink-0 rounded-[4px] border accent-primary shadow-xs"
                                        />
                                        Aktif
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Button disabled={processing}>
                                            Simpan
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <Link href={subjectsIndex().url}>
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

AdminSubjectCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Kelola Mata Pelajaran', href: subjectsIndex() },
        { title: 'Tambah', href: subjectsCreate() },
    ],
};
