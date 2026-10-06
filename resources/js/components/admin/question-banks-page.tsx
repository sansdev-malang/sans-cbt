import { Link, router } from '@inertiajs/react';
import {
    Ellipsis,
    FileText,
    FolderOpen,
    Layers,
    ListChecks,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { BankDialog } from '@/components/admin/question-bank-dialogs';
import {
    compositionText,
    SHORT_TYPE_LABELS,
    type BankOption,
    type QuestionBank,
    type QuestionBankControllerApi,
} from '@/components/admin/question-bank-types';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export type QuestionBanksPageProps = {
    variant: 'admin' | 'teacher';
    controller: QuestionBankControllerApi;
    banks: QuestionBank[];
    subjects: BankOption[];
    classes: BankOption[];
    teachers?: BankOption[];
};

/**
 * Shared Bank Soal index for admin and teacher areas: summary stats, filters,
 * and a compact bank table. Questions are managed on the per-bank detail page
 * (question-banks.show), so this list stays scannable.
 */
export default function QuestionBanksPage({
    variant,
    controller,
    banks,
    subjects,
    classes,
    teachers = [],
}: QuestionBanksPageProps) {
    const isAdmin = variant === 'admin';
    const [bankDialogOpen, setBankDialogOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
    const [bankToDelete, setBankToDelete] = useState<QuestionBank | null>(null);
    const [search, setSearch] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');

    const openCreateBank = () => {
        setEditingBank(null);
        setBankDialogOpen(true);
    };

    const openEditBank = (bank: QuestionBank) => {
        setEditingBank(bank);
        setBankDialogOpen(true);
    };

    const stats = useMemo(() => {
        const byType = Object.fromEntries(
            Object.keys(SHORT_TYPE_LABELS).map((type) => [type, 0]),
        ) as Record<keyof typeof SHORT_TYPE_LABELS, number>;
        let totalQuestions = 0;
        for (const bank of banks) {
            totalQuestions += bank.questions_count;
            for (const question of bank.questions) {
                byType[question.type] = (byType[question.type] ?? 0) + 1;
            }
        }
        return { totalBanks: banks.length, totalQuestions, byType };
    }, [banks]);

    const filtered = useMemo(
        () =>
            banks.filter((bank) => {
                if (
                    subjectFilter &&
                    String(bank.subject_id) !== subjectFilter
                ) {
                    return false;
                }
                // Banks without a class (or teacher) apply to every class, so
                // they stay visible under any class/teacher filter.
                if (
                    classFilter &&
                    bank.school_class_id !== null &&
                    String(bank.school_class_id) !== classFilter
                ) {
                    return false;
                }
                if (
                    teacherFilter &&
                    bank.teacher_id !== null &&
                    bank.teacher_id !== undefined &&
                    String(bank.teacher_id) !== teacherFilter
                ) {
                    return false;
                }
                const haystack = [
                    bank.name,
                    bank.subject,
                    bank.material ?? '',
                    bank.class ?? '',
                    bank.teacher ?? '',
                    ...bank.questions.map((question) => question.content),
                ]
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(search.trim().toLowerCase());
            }),
        [banks, search, subjectFilter, classFilter, teacherFilter],
    );

    const filteredQuestionCount = filtered.reduce(
        (sum, bank) => sum + bank.questions_count,
        0,
    );

    const hasActiveFilter =
        search.trim() !== '' ||
        subjectFilter !== '' ||
        classFilter !== '' ||
        teacherFilter !== '';

    const resetFilters = () => {
        setSearch('');
        setSubjectFilter('');
        setClassFilter('');
        setTeacherFilter('');
    };

    const destroyBank = () => {
        if (!bankToDelete) return;
        router.delete(controller.destroyBank.url(bankToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setBankToDelete(null),
        });
    };

    const columnCount = isAdmin ? 6 : 5;

    return (
        <div className="flex h-full flex-1 flex-col gap-5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <Heading
                    title="Bank Soal"
                    description={
                        isAdmin
                            ? 'Kelola seluruh bank soal guru. Klik nama bank untuk melihat dan mengelola soal di dalamnya.'
                            : 'Kelola kumpulan soal untuk ujian Anda. Klik nama bank untuk mengisi soal pilihan ganda, benar/salah, menjodohkan, atau esai.'
                    }
                />
                <Button onClick={openCreateBank}>
                    <Plus />
                    Buat Bank Soal
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={<Layers className="size-5" />}
                    label="Bank Soal"
                    value={stats.totalBanks.toString()}
                    hint="kelompok soal yang dikelola"
                />
                <StatCard
                    icon={<FileText className="size-5" />}
                    label="Total Soal"
                    value={stats.totalQuestions.toString()}
                    hint="siap dipakai menyusun ujian"
                />
                <Card className="gap-0 py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ListChecks className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-muted-foreground">
                                Komposisi Tipe Soal
                            </p>
                            {stats.totalQuestions > 0 ? (
                                <p className="mt-0.5 truncate text-sm">
                                    {compositionText(
                                        banks.flatMap((bank) => bank.questions),
                                    )}
                                </p>
                            ) : (
                                <p className="mt-0.5 text-sm">Belum ada soal</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        aria-label="Cari bank atau soal"
                        placeholder="Cari bank, materi, atau isi soal..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="pl-8"
                    />
                </div>
                <FilterSelect
                    ariaLabel="Filter mata pelajaran"
                    value={subjectFilter}
                    onChange={setSubjectFilter}
                    allLabel="Semua Mata Pelajaran"
                    options={subjects}
                />
                {isAdmin ? (
                    <FilterSelect
                        ariaLabel="Filter guru"
                        value={teacherFilter}
                        onChange={setTeacherFilter}
                        allLabel="Semua Guru"
                        options={teachers}
                    />
                ) : (
                    <FilterSelect
                        ariaLabel="Filter kelas"
                        value={classFilter}
                        onChange={setClassFilter}
                        allLabel="Semua Kelas"
                        options={classes}
                    />
                )}
                <p className="ml-auto text-sm text-muted-foreground">
                    Menampilkan {filtered.length} dari {banks.length} bank ·{' '}
                    {filteredQuestionCount} soal
                </p>
            </div>

            {banks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <FolderOpen className="size-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">
                            Belum ada bank soal
                        </h3>
                        <p className="max-w-md text-sm text-muted-foreground">
                            Bank soal adalah wadah untuk mengelompokkan soal —
                            misalnya per mata pelajaran, kelas, atau bab materi.
                            Buat bank terlebih dahulu, lalu isi dengan soal agar
                            mudah dipakai saat menyusun ujian.
                        </p>
                        <Button onClick={openCreateBank}>
                            <Plus />
                            Buat Bank Soal Pertama
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="gap-0 py-0">
                    <CardContent className="overflow-x-auto px-0 pb-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                                    <th className="px-6 py-3 font-medium">
                                        Bank Soal
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Mata Pelajaran
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Kelas
                                    </th>
                                    {isAdmin && (
                                        <th className="px-4 py-3 font-medium">
                                            Guru
                                        </th>
                                    )}
                                    <th className="px-4 py-3 font-medium">
                                        Jumlah Soal
                                    </th>
                                    <th className="px-6 py-3 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((bank) => (
                                    <BankRow
                                        key={bank.id}
                                        bank={bank}
                                        isAdmin={isAdmin}
                                        showBankUrl={controller.showBank.url(
                                            bank.id,
                                        )}
                                        onEdit={() => openEditBank(bank)}
                                        onDelete={() => setBankToDelete(bank)}
                                    />
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={columnCount}
                                            className="px-6 py-10 text-center"
                                        >
                                            <p className="text-sm font-medium">
                                                Tidak ada bank soal yang cocok
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Coba kata kunci lain, atau hapus
                                                filter yang sedang aktif.
                                            </p>
                                            {hasActiveFilter && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={resetFilters}
                                                    className="mt-3"
                                                >
                                                    Hapus Semua Filter
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {bankDialogOpen && (
                <BankDialog
                    open
                    onOpenChange={setBankDialogOpen}
                    bank={editingBank}
                    controller={controller}
                    isAdmin={isAdmin}
                    subjects={subjects}
                    classes={classes}
                    teachers={teachers}
                />
            )}

            <DeleteConfirmationDialog
                open={bankToDelete !== null}
                onOpenChange={(open) => !open && setBankToDelete(null)}
                itemName={
                    bankToDelete
                        ? `${bankToDelete.name} beserta ${bankToDelete.questions_count} soal di dalamnya`
                        : null
                }
                onConfirm={destroyBank}
            />
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    hint,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <Card className="gap-0 py-0">
            <CardContent className="flex items-center gap-3 px-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-2xl leading-none font-semibold">
                        {value}
                    </p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function FilterSelect({
    ariaLabel,
    value,
    onChange,
    allLabel,
    options,
}: {
    ariaLabel: string;
    value: string;
    onChange: (value: string) => void;
    allLabel: string;
    options: BankOption[];
}) {
    return (
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
            <option value="">{allLabel}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function BankRow({
    bank,
    isAdmin,
    showBankUrl,
    onEdit,
    onDelete,
}: {
    bank: QuestionBank;
    isAdmin: boolean;
    showBankUrl: string;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const composition = compositionText(bank.questions);

    return (
        <tr className="border-b transition-colors last:border-0 hover:bg-muted/40">
            <td className="max-w-[16rem] px-6 py-3.5">
                <Link
                    href={showBankUrl}
                    className="font-medium hover:underline"
                >
                    {bank.name}
                </Link>
                {bank.material && (
                    <p className="truncate text-xs text-muted-foreground">
                        {bank.material}
                    </p>
                )}
            </td>
            <td className="px-4 py-3.5">{bank.subject}</td>
            <td className="px-4 py-3.5 whitespace-nowrap">
                {bank.class ?? 'Semua kelas'}
            </td>
            {isAdmin && (
                <td className="px-4 py-3.5 whitespace-nowrap">
                    {bank.teacher ?? '—'}
                </td>
            )}
            <td className="px-4 py-3.5">
                <span className="font-medium">{bank.questions_count} soal</span>
                <p className="truncate text-xs text-muted-foreground">
                    {composition || 'Belum ada soal'}
                </p>
            </td>
            <td className="px-6 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                    <Button asChild size="sm" variant="outline">
                        <Link href={showBankUrl}>Lihat Soal</Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Menu bank ${bank.name}`}
                            >
                                <Ellipsis />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={onEdit}>
                                <Pencil />
                                Edit Bank
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={onDelete}
                            >
                                <Trash2 />
                                Hapus Bank
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    );
}
