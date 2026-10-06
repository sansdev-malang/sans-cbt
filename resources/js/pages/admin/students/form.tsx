import { Form, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { RouteFormDefinition } from '@/wayfinder';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/students';

type Option = { value: number; label: string };
type Student = {
    id?: number;
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

export function StudentForm({
    action,
    student,
    classes,
    users,
    onSuccess,
    onCancel,
}: {
    action: RouteFormDefinition<'post'> | RouteFormDefinition<'patch'>;
    student: Student;
    classes: Option[];
    users: Option[];
    onSuccess?: () => void;
    onCancel?: () => void;
}) {
    return (
        <Card className="max-w-2xl">
            <CardContent>
                <Form
                    {...action}
                    options={{ preserveScroll: true }}
                    onSuccess={onSuccess}
                    className="space-y-5"
                >
                    {({ processing, errors }): ReactNode => (
                        <>
                            <Field
                                label="Nama lengkap"
                                name="full_name"
                                required
                                defaultValue={student.full_name}
                                error={errors.full_name}
                            />
                            <Field
                                label="NIS"
                                name="nis"
                                required
                                defaultValue={student.nis}
                                error={errors.nis}
                            />
                            <Field
                                label="NISN"
                                name="nisn"
                                defaultValue={student.nisn ?? ''}
                                error={errors.nisn}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="user_id">
                                    Akun login siswa
                                </Label>
                                <select
                                    id="user_id"
                                    name="user_id"
                                    defaultValue={student.user_id ?? ''}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                >
                                    <option value="">Belum dihubungkan</option>
                                    {users.map((user) => (
                                        <option
                                            key={user.value}
                                            value={user.value}
                                        >
                                            {user.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.user_id} />
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="gender">
                                        Jenis kelamin
                                    </Label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        defaultValue={student.gender ?? ''}
                                        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                    >
                                        <option value="">Tidak diisi</option>
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                    <InputError message={errors.gender} />
                                </div>
                                <Field
                                    label="Tanggal lahir"
                                    name="birth_date"
                                    type="date"
                                    defaultValue={student.birth_date ?? ''}
                                    error={errors.birth_date}
                                />
                            </div>
                            <Field
                                label="Nomor telepon"
                                name="phone"
                                defaultValue={student.phone ?? ''}
                                error={errors.phone}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat</Label>
                                <textarea
                                    id="address"
                                    name="address"
                                    rows={3}
                                    defaultValue={student.address ?? ''}
                                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                                <InputError message={errors.address} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="class_ids">Kelas</Label>
                                <select
                                    id="class_ids"
                                    name="class_ids[]"
                                    multiple
                                    defaultValue={student.class_ids.map(String)}
                                    className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                >
                                    {classes.map((schoolClass) => (
                                        <option
                                            key={schoolClass.value}
                                            value={schoolClass.value}
                                        >
                                            {schoolClass.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Tekan Ctrl/Cmd untuk memilih lebih dari satu
                                    kelas.
                                </p>
                                <InputError message={errors.class_ids} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button disabled={processing}>Simpan</Button>
                                {onCancel ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onCancel}
                                    >
                                        Batal
                                    </Button>
                                ) : (
                                    <Button variant="outline" asChild>
                                        <Link href={index().url}>Batal</Link>
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function Field({
    label,
    name,
    type = 'text',
    required = false,
    defaultValue,
    error,
}: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    defaultValue: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                name={name}
                type={type}
                required={required}
                defaultValue={defaultValue}
            />
            <InputError message={error} />
        </div>
    );
}
