import { Form, Link } from '@inertiajs/react';
import { useMemo, useState, type ReactNode } from 'react';
import type { RouteFormDefinition } from '@/wayfinder';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Search, X } from 'lucide-react';
import { index } from '@/routes/admin/students';

type Option = { value: number; label: string };
type Student = {
    id?: number;
    unit?: 'sd' | 'smp' | string;
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
    inDialog = false,
}: {
    action: RouteFormDefinition<'post'> | RouteFormDefinition<'patch'>;
    student: Student;
    classes: Option[];
    users: Option[];
    onSuccess?: () => void;
    onCancel?: () => void;
    inDialog?: boolean;
}) {
    const [selectedClassIds, setSelectedClassIds] = useState<number[]>(() =>
        student.class_ids.map(Number),
    );
    const [classSearch, setClassSearch] = useState('');
    const filteredClasses = useMemo(() => {
        const query = classSearch.trim().toLocaleLowerCase();

        return classes.filter((schoolClass) =>
            schoolClass.label.toLocaleLowerCase().includes(query),
        );
    }, [classSearch, classes]);
    const selectedClasses = classes.filter((schoolClass) =>
        selectedClassIds.includes(schoolClass.value),
    );
    const toggleClass = (classId: number) => {
        setSelectedClassIds((current) =>
            current.includes(classId)
                ? current.filter((id) => id !== classId)
                : [...current, classId],
        );
    };

    const form = (
        <Form
            {...action}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            className={
                inDialog
                    ? 'flex min-h-0 flex-1 flex-col'
                    : 'space-y-5'
            }
        >
            {({ processing, errors }): ReactNode => (
                <>
                    <div
                        className={
                            inDialog
                                ? 'min-h-0 flex-1 space-y-5 overflow-y-auto pr-1'
                                : 'space-y-5'
                        }
                    >
                    <div className="grid gap-2">
                        <Label htmlFor="student-unit">Unit Sekolah</Label>
                        <select
                            id="student-unit"
                            name="unit"
                            defaultValue={student.unit ?? 'sd'}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground dark:scheme-dark"
                        >
                            <option
                                className="bg-background text-foreground"
                                value="sd"
                            >
                                Unit SD
                            </option>
                            <option
                                className="bg-background text-foreground"
                                value="smp"
                            >
                                Unit SMP
                            </option>
                        </select>
                        <InputError message={errors.unit} />
                    </div>
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
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground dark:scheme-dark"
                        >
                            <option
                                className="bg-background text-foreground"
                                value=""
                            >
                                Belum dihubungkan
                            </option>
                            {users.map((user) => (
                                <option
                                    key={user.value}
                                    value={user.value}
                                    className="bg-background text-foreground"
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
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground dark:scheme-dark"
                            >
                                <option
                                    className="bg-background text-foreground"
                                    value=""
                                >
                                    Tidak diisi
                                </option>
                                <option
                                    className="bg-background text-foreground"
                                    value="L"
                                >
                                    Laki-laki
                                </option>
                                <option
                                    className="bg-background text-foreground"
                                    value="P"
                                >
                                    Perempuan
                                </option>
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
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <InputError message={errors.address} />
                    </div>
                    <div className="grid gap-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="grid gap-1">
                                <Label htmlFor="class-search">Kelas</Label>
                                <p className="text-xs text-muted-foreground">
                                    Pilih satu atau beberapa kelas untuk siswa.
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                {selectedClassIds.length} dipilih
                            </span>
                        </div>

                        <div className="overflow-hidden rounded-lg border bg-background">
                            <div className="flex items-center gap-2 border-b px-3">
                                <Search className="size-4 shrink-0 text-muted-foreground" />
                                <Input
                                    id="class-search"
                                    type="search"
                                    value={classSearch}
                                    onChange={(event) =>
                                        setClassSearch(event.target.value)
                                    }
                                    placeholder="Cari nama kelas atau tahun ajaran..."
                                    className="border-0 px-0 shadow-none focus-visible:ring-0"
                                />
                            </div>

                            {selectedClasses.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
                                    {selectedClasses.map((schoolClass) => (
                                        <span
                                            key={schoolClass.value}
                                            className="inline-flex items-center gap-1 rounded-full border bg-muted/60 py-1 pl-2.5 pr-1 text-xs font-medium text-foreground"
                                        >
                                            {schoolClass.label}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleClass(schoolClass.value)
                                                }
                                                aria-label={`Hapus kelas ${schoolClass.label}`}
                                                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedClassIds([])}
                                        className="px-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                    >
                                        Hapus semua
                                    </button>
                                </div>
                            )}

                            <div className="max-h-44 overflow-y-auto p-1.5">
                                {filteredClasses.length > 0 ? (
                                    filteredClasses.map((schoolClass) => {
                                        const selected =
                                            selectedClassIds.includes(
                                                schoolClass.value,
                                            );

                                        return (
                                            <label
                                                key={schoolClass.value}
                                                htmlFor={`class-option-${schoolClass.value}`}
                                                className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-muted/70"
                                            >
                                                <Checkbox
                                                    id={`class-option-${schoolClass.value}`}
                                                    checked={selected}
                                                    onCheckedChange={() =>
                                                        toggleClass(
                                                            schoolClass.value,
                                                        )
                                                    }
                                                />
                                                <span className="min-w-0 flex-1 text-sm text-foreground">
                                                    {schoolClass.label}
                                                </span>
                                                {selected && (
                                                    <Check className="size-4 text-primary" />
                                                )}
                                            </label>
                                        );
                                    })
                                ) : (
                                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                        {classes.length === 0
                                            ? 'Belum ada kelas yang tersedia.'
                                            : 'Kelas tidak ditemukan.'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {selectedClassIds.map((classId) => (
                            <input
                                key={classId}
                                type="hidden"
                                name="class_ids[]"
                                value={classId}
                            />
                        ))}
                        <InputError message={errors.class_ids} />
                    </div>
                    </div>
                    <div
                        className={
                            inDialog
                                ? 'flex shrink-0 items-center justify-end gap-2 border-t pt-4'
                                : "flex items-center gap-2"
                        }
                    >
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
    );

    return inDialog ? form : (
        <Card className="max-w-2xl">
            <CardContent>{form}</CardContent>
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
