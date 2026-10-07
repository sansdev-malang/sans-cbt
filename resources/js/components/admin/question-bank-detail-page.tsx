import { Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Ellipsis,
    FolderOpen,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import {
    AddQuestionDialog,
    BankDialog,
    QuestionEditDialog,
} from "@/components/admin/question-bank-dialogs";
import {
    DIFFICULTY_VARIANT,
    SHORT_TYPE_LABELS,
    type BankOption,
    type BankQuestion,
    type QuestionBank,
    type QuestionBankControllerApi,
} from "@/components/admin/question-bank-types";
import { QUESTION_TYPE_LABELS } from "@/components/admin/question-form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export type QuestionBankDetailPageProps = {
    variant: "admin" | "teacher";
    controller: QuestionBankControllerApi;
    bank: QuestionBank;
    indexUrl: string;
    subjects: BankOption[];
    classes: BankOption[];
    teachers?: BankOption[];
};

/**
 * Shared per-bank detail page: lists the bank's questions in a table and hosts
 * every bank-level action (add question, edit bank, delete bank).
 */
export default function QuestionBankDetailPage({
    variant,
    controller,
    bank,
    indexUrl,
    subjects,
    classes,
    teachers = [],
}: QuestionBankDetailPageProps) {
    const isAdmin = variant === "admin";
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editQuestion, setEditQuestion] = useState<BankQuestion | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [search, setSearch] = useState("");

    const questions = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return bank.questions;
        return bank.questions.filter(
            (question) =>
                question.content.toLowerCase().includes(needle) ||
                Boolean(question.stimulus?.toLowerCase().includes(needle)),
        );
    }, [bank, search]);

    const destroyBank = () => {
        router.delete(controller.destroyBank.url(bank.id), {
            onSuccess: () => router.visit(indexUrl),
        });
    };

    const metaParts = [
        bank.subject,
        bank.class ?? "Semua kelas",
        ...(isAdmin && bank.teacher ? [bank.teacher] : []),
        ...(bank.material ? [bank.material] : []),
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FolderOpen className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold tracking-tight">
                            {bank.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {metaParts.join(" · ")}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary">
                                {bank.questions_count} soal
                            </Badge>
                            {(
                                Object.entries(SHORT_TYPE_LABELS) as [
                                    keyof typeof SHORT_TYPE_LABELS,
                                    string,
                                ][]
                            ).map(([type, label]) => {
                                const count = bank.questions.filter(
                                    (question) => question.type === type,
                                ).length;
                                if (count === 0) return null;
                                return (
                                    <Badge
                                        key={type}
                                        variant="outline"
                                        className="font-normal text-muted-foreground"
                                    >
                                        {label} {count}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <Button onClick={() => setAddOpen(true)}>
                        <Plus />
                        Tambah Soal
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
                            <DropdownMenuItem
                                onSelect={() => setEditOpen(true)}
                            >
                                <Pencil />
                                Edit Bank
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteOpen(true)}
                            >
                                <Trash2 />
                                Hapus Bank
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="gap-0 py-0">
                <CardContent className="px-0 pb-0">
                    {bank.questions.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-1 pb-4">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    aria-label="Cari soal di bank ini"
                                    placeholder="Cari soal di bank ini..."
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="pl-8"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {questions.length} dari {bank.questions_count}{" "}
                                soal
                            </p>
                        </div>
                    )}

                    {bank.questions.length === 0 ? (
                        <div className="mx-6 mb-6 flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
                            <p className="text-sm font-medium">
                                Bank ini masih kosong
                            </p>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                Tambahkan soal pertama agar bank ini bisa
                                dipakai saat menyusun ujian.
                            </p>
                            <Button size="sm" onClick={() => setAddOpen(true)}>
                                <Plus />
                                Tambah Soal Pertama
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-y text-left text-xs text-muted-foreground uppercase">
                                        <th className="w-12 px-6 py-3 font-medium">
                                            No
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Soal
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Tipe
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Kesulitan
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Bobot
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((question, index) => (
                                        <tr
                                            key={question.id}
                                            className="border-b transition-colors last:border-0 hover:bg-muted/40"
                                        >
                                            <td className="px-6 py-3.5 text-muted-foreground">
                                                {index + 1}
                                            </td>
                                            <td className="max-w-[28rem] px-4 py-3.5">
                                                {question.stimulus && (
                                                    <div className="mb-1">
                                                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                                            Stimulus
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditQuestion(
                                                            question,
                                                        )
                                                    }
                                                    dir="auto"
                                                    className="font-content line-clamp-2 text-left hover:underline"
                                                >
                                                    {question.content}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <Badge
                                                    variant="outline"
                                                    className="font-normal"
                                                >
                                                    {QUESTION_TYPE_LABELS[
                                                        question.type
                                                    ] ?? question.type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {question.difficulty ? (
                                                    <Badge
                                                        variant={
                                                            DIFFICULTY_VARIANT[
                                                                question
                                                                    .difficulty
                                                            ] ?? "secondary"
                                                        }
                                                        className="font-normal"
                                                    >
                                                        {question.difficulty}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {question.weight}
                                            </td>
                                            <td className="px-6 py-3.5 text-right whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setEditQuestion(
                                                            question,
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {questions.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-10 text-center"
                                            >
                                                <p className="text-sm font-medium">
                                                    Tidak ada soal yang cocok
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Coba kata kunci lain.
                                                </p>
                                                {search.trim() !== "" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSearch("")
                                                        }
                                                        className="mt-3"
                                                    >
                                                        Hapus Pencarian
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={indexUrl}>
                        <ArrowLeft />
                        Kembali ke Bank Soal
                    </Link>
                </Button>
            </div>

            {addOpen && (
                <AddQuestionDialog
                    onOpenChange={setAddOpen}
                    bank={bank}
                    controller={controller}
                />
            )}
            {editOpen && (
                <BankDialog
                    open
                    onOpenChange={setEditOpen}
                    bank={bank}
                    controller={controller}
                    isAdmin={isAdmin}
                    subjects={subjects}
                    classes={classes}
                    teachers={teachers}
                />
            )}
            {editQuestion && (
                <QuestionEditDialog
                    question={editQuestion}
                    bank={bank}
                    controller={controller}
                    onOpenChange={(open) => !open && setEditQuestion(null)}
                />
            )}

            <DeleteConfirmationDialog
                open={deleteOpen}
                onOpenChange={(open) => !open && setDeleteOpen(false)}
                itemName={`${bank.name} beserta ${bank.questions_count} soal di dalamnya`}
                onConfirm={destroyBank}
            />
        </div>
    );
}
