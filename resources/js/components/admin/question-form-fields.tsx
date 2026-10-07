import { useRef, useState } from "react";
import ImageUploadField from "@/components/admin/image-upload-field";
import SymbolPalette from "@/components/admin/symbol-palette";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type QuestionType =
    | "multiple_choice"
    | "multiple_answers"
    | "true_false"
    | "statement_true_false"
    | "matching"
    | "essay";

type OptionValue = {
    content: string;
    is_correct?: boolean;
    image_path?: string | null;
    image_url?: string | null;
};
type QuestionValue = {
    type?: QuestionType;
    content?: string;
    stimulus?: string | null;
    difficulty?: string | null;
    weight?: number;
    image_path?: string | null;
    image_url?: string | null;
    options?: OptionValue[];
    pairs?: {
        left_text: string;
        right_text: string;
        left_image_path?: string | null;
        left_image_url?: string | null;
        right_image_path?: string | null;
        right_image_url?: string | null;
    }[];
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    multiple_choice: "Pilihan Ganda",
    multiple_answers: "Pilihan Ganda Kompleks",
    true_false: "Benar/Salah",
    statement_true_false: "Menjodohkan (Benar-Salah)",
    matching: "Menjodohkan (Pasangan)",
    essay: "Esai",
};

const DIFFICULTIES = ["Mudah", "Sedang", "Sulit"];

/**
 * Shared question fields used by both the create dialog and the edit page.
 * Input names follow PHP bracket notation so Laravel receives nested option data.
 */
export default function QuestionFormFields({
    question,
    errors,
    idPrefix,
    paletteStickyClass = "top-0",
}: {
    question?: QuestionValue | null;
    errors: Partial<Record<string, string>>;
    idPrefix: string;
    /** Kelas sticky untuk palet simbol; "top-14"/"top-16" jika di halaman dengan header tetap. */
    paletteStickyClass?: string;
}) {
    const [type, setType] = useState<QuestionType>(
        question?.type ?? "multiple_choice",
    );
    const [optionCount, setOptionCount] = useState(() =>
        question?.options?.length
            ? Math.min(5, Math.max(4, question.options.length))
            : 4,
    );
    const [correct, setCorrect] = useState(() => {
        const index = question?.options?.findIndex(
            (option) => option.is_correct,
        );
        return index !== undefined && index > -1 ? index : 0;
    });
    const [correctSet, setCorrectSet] = useState<Set<number>>(
        () =>
            new Set(
                (question?.options ?? [])
                    .map((option, index) => (option.is_correct ? index : -1))
                    .filter((index) => index > -1),
            ),
    );
    const [statementCount, setStatementCount] = useState(() =>
        question?.type === "statement_true_false" && question.options?.length
            ? question.options.length
            : 4,
    );
    const [statementTrue, setStatementTrue] = useState<Record<number, boolean>>(
        () =>
            Object.fromEntries(
                (question?.options ?? []).map(
                    (option, index): [number, boolean] => [
                        index,
                        option.is_correct === true,
                    ],
                ),
            ),
    );
    const [pairCount, setPairCount] = useState(() =>
        question?.type === "matching" && question.pairs?.length
            ? question.pairs.length
            : 3,
    );
    const id = (name: string) => `${idPrefix}-${name}`;
    const usesOptions =
        type === "multiple_choice" || type === "multiple_answers";

    // Palet simbol menyisipkan karakter ke kolom teks yang terakhir diklik.
    const paletteTargetRef = useRef<
        HTMLTextAreaElement | HTMLInputElement | null
    >(null);
    const trackPaletteTarget = (
        event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => {
        paletteTargetRef.current = event.currentTarget;
    };

    const toggleCorrect = (index: number) => {
        setCorrectSet((current) => {
            const next = new Set(current);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    return (
        <>
            <SymbolPalette
                getTarget={() => paletteTargetRef.current}
                stickyTopClass={paletteStickyClass}
            />
            
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor={id("type")}>Tipe soal</Label>
                    <select
                        id={id("type")}
                        name="type"
                        value={type}
                        onChange={(event) =>
                            setType(event.target.value as QuestionType)
                        }
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                        {Object.entries(QUESTION_TYPE_LABELS).map(
                            ([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ),
                        )}
                    </select>
                    <InputError message={errors.type} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={id("difficulty")}>Tingkat kesulitan</Label>
                    <select
                        id={id("difficulty")}
                        name="difficulty"
                        defaultValue={question?.difficulty ?? "Sedang"}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                        {DIFFICULTIES.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                                {difficulty}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.difficulty} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor={id("stimulus")}>
                    Stimulus / Bacaan (opsional)
                </Label>
                <textarea
                    id={id("stimulus")}
                    name="stimulus"
                    rows={4}
                    defaultValue={question?.stimulus ?? ""}
                    onFocus={trackPaletteTarget}
                    placeholder="Teks bacaan, paragraf, atau skenario yang ditampilkan sebelum pertanyaan (kosongkan jika tidak ada)..."
                    className="font-content w-full rounded-md border border-input bg-background p-2 text-sm"
                />
                <InputError message={errors.stimulus} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={id("content")}>Pertanyaan</Label>
                <textarea
                    id={id("content")}
                    name="content"
                    required
                    rows={4}
                    defaultValue={question?.content ?? ""}
                    onFocus={trackPaletteTarget}
                    placeholder="Tulis pertanyaan..."
                    className="font-content w-full rounded-md border border-input bg-background p-2 text-sm"
                />
                <InputError message={errors.content} />
            </div>

            

            <div className="grid gap-2">
                <Label>Gambar soal (opsional)</Label>
                <ImageUploadField
                    fileField="image"
                    pathField="image_path"
                    removeField="remove_image"
                    existingPath={question?.image_path ?? null}
                    existingUrl={question?.image_url ?? null}
                    error={errors.image}
                    label="Tambahkan gambar untuk soal"
                />
            </div>

            {usesOptions && (
                <div className="grid gap-2">
                    <Label>
                        {type === "multiple_answers"
                            ? "Pilihan jawaban & kunci (boleh lebih dari satu)"
                            : "Pilihan jawaban & kunci"}
                    </Label>
                    {Array.from({ length: optionCount }, (_, index) => {
                        const letter = String.fromCharCode(65 + index);
                        const existing = question?.options?.[index];
                        return (
                            <div
                                key={index}
                                className="flex items-start gap-2 rounded-md border p-2.5"
                            >
                                {type === "multiple_answers" ? (
                                    <input
                                        aria-label={`Jadikan pilihan ${letter} sebagai kunci jawaban`}
                                        type="checkbox"
                                        checked={correctSet.has(index)}
                                        onChange={() => toggleCorrect(index)}
                                        className="mt-2.5"
                                    />
                                ) : (
                                    <input
                                        aria-label={`Jadikan pilihan ${letter} sebagai kunci jawaban`}
                                        type="radio"
                                        name={`${idPrefix}-correct-ui`}
                                        checked={correct === index}
                                        onChange={() => setCorrect(index)}
                                        className="mt-2.5"
                                    />
                                )}
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 text-sm font-medium">
                                            {letter}.
                                        </span>
                                        <Input
                                            name={`options[${index}][content]`}
                                            required
                                            onFocus={trackPaletteTarget}
                                            placeholder={`Pilihan ${letter}`}
                                            defaultValue={
                                                existing?.content ?? ""
                                            }
                                        />
                                    </div>
                                    <OptionImageInput
                                        name={`options[${index}]`}
                                        existingPath={
                                            existing?.image_path ?? null
                                        }
                                        existingUrl={
                                            existing?.image_url ?? null
                                        }
                                        error={errors[`options.${index}.image`]}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {type === "multiple_answers" ? (
                        [...correctSet].map((index) => (
                            <input
                                key={`correct-${index}`}
                                type="hidden"
                                name="correct_options[]"
                                value={index}
                            />
                        ))
                    ) : (
                        <input
                            type="hidden"
                            name="correct_option"
                            value={correct}
                        />
                    )}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={optionCount >= 5}
                            onClick={() =>
                                setOptionCount((count) =>
                                    Math.min(5, count + 1),
                                )
                            }
                        >
                            Tambah Pilihan
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={optionCount <= 4}
                            onClick={() => {
                                const next = Math.max(4, optionCount - 1);
                                setOptionCount(next);
                                setCorrect((current) =>
                                    current >= next ? 0 : current,
                                );
                                setCorrectSet(
                                    (current) =>
                                        new Set(
                                            [...current].filter(
                                                (index) => index < next,
                                            ),
                                        ),
                                );
                            }}
                        >
                            Kurangi Pilihan
                        </Button>
                    </div>
                    <InputError
                        message={
                            errors.options ??
                            errors.correct_option ??
                            errors.correct_options ??
                            errors["options.0.content"]
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        {type === "multiple_answers"
                            ? "Minimal 4 pilihan (A–E). Centang semua pilihan yang merupakan jawaban benar."
                            : "Minimal 4 pilihan, maksimal 5 (A–E). Klik bulatan di kiri untuk menandai kunci jawaban."}
                    </p>
                </div>
            )}

            {type === "true_false" && (
                <div className="grid gap-2">
                    <Label>Kunci jawaban</Label>
                    {["Benar", "Salah"].map((label, index) => (
                        <label
                            key={label}
                            className="flex items-center gap-2 text-sm"
                        >
                            <input
                                type="radio"
                                name={`${idPrefix}-tf-ui`}
                                checked={correct === index}
                                onChange={() => setCorrect(index)}
                            />
                            {label}
                        </label>
                    ))}
                    <input
                        type="hidden"
                        name="correct_option"
                        value={correct}
                    />
                    <InputError message={errors.correct_option} />
                    <p className="text-xs text-muted-foreground">
                        Pilihan Benar/Salah dibuat otomatis oleh sistem.
                    </p>
                </div>
            )}

            {type === "statement_true_false" && (
                <div className="grid gap-2">
                    <Label>Pernyataan &amp; kunci (Benar/Salah)</Label>
                    {Array.from({ length: statementCount }, (_, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-2 rounded-md border p-2.5"
                        >
                            <span className="w-5 pt-2 text-sm font-medium">
                                {index + 1}.
                            </span>
                            <div className="min-w-0 flex-1 space-y-2">
                                <Input
                                    name={`statements[${index}][content]`}
                                    required
                                    onFocus={trackPaletteTarget}
                                    placeholder={`Pernyataan ${index + 1}`}
                                    defaultValue={
                                        question?.options?.[index]?.content ??
                                        ""
                                    }
                                />
                                <div className="flex gap-4 text-sm">
                                    {[true, false].map((isTrue) => (
                                        <label
                                            key={String(isTrue)}
                                            className="flex items-center gap-1.5"
                                        >
                                            <input
                                                type="radio"
                                                name={`${idPrefix}-statement-${index}-ui`}
                                                checked={
                                                    (statementTrue[index] ??
                                                        true) === isTrue
                                                }
                                                onChange={() =>
                                                    setStatementTrue(
                                                        (current) => ({
                                                            ...current,
                                                            [index]: isTrue,
                                                        }),
                                                    )
                                                }
                                            />
                                            {isTrue
                                                ? "Kunci: Benar"
                                                : "Kunci: Salah"}
                                        </label>
                                    ))}
                                </div>
                                <input
                                    type="hidden"
                                    name={`statements[${index}][is_true]`}
                                    value={
                                        (statementTrue[index] ?? true)
                                            ? "1"
                                            : "0"
                                    }
                                />
                                <OptionImageInput
                                    name={`statements[${index}]`}
                                    existingPath={
                                        question?.options?.[index]
                                            ?.image_path ?? null
                                    }
                                    existingUrl={
                                        question?.options?.[index]?.image_url ??
                                        null
                                    }
                                    error={
                                        errors[`options.${index}.image`] as
                                            string | undefined
                                    }
                                />
                                <InputError
                                    message={
                                        errors[`statements.${index}.content`] ??
                                        errors[`options.${index}.content`]
                                    }
                                />
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={statementCount >= 10}
                            onClick={() =>
                                setStatementCount((count) =>
                                    Math.min(10, count + 1),
                                )
                            }
                        >
                            Tambah Pernyataan
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={statementCount <= 2}
                            onClick={() =>
                                setStatementCount((count) =>
                                    Math.max(2, count - 1),
                                )
                            }
                        >
                            Kurangi Pernyataan
                        </Button>
                    </div>
                    <InputError message={errors.options} />
                    <p className="text-xs text-muted-foreground">
                        Siswa menilai setiap pernyataan Benar atau Salah.
                        Minimal 2, maksimal 10 pernyataan.
                    </p>
                </div>
            )}

            {type === "matching" && (
                <div className="grid gap-2">
                    <Label>Pasangan kiri &amp; kanan</Label>
                    {Array.from({ length: pairCount }, (_, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 rounded-md border p-2.5"
                        >
                            <span className="w-5 text-sm font-medium">
                                {index + 1}.
                            </span>
                            <div className="grid flex-1 gap-2 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Input
                                        name={`pairs[${index}][left_text]`}
                                        required
                                        onFocus={trackPaletteTarget}
                                        placeholder={`Kiri ${index + 1} (yang dijodohkan)`}
                                        defaultValue={
                                            question?.pairs?.[index]
                                                ?.left_text ?? ""
                                        }
                                    />
                                    <OptionImageFields
                                        fileField={`pairs[${index}][left_image]`}
                                        pathField={`pairs[${index}][left_image_path]`}
                                        removeField={`pairs[${index}][left_remove_image]`}
                                        existingPath={
                                            question?.pairs?.[index]
                                                ?.left_image_path ?? null
                                        }
                                        existingUrl={
                                            question?.pairs?.[index]
                                                ?.left_image_url ?? null
                                        }
                                        error={
                                            errors[
                                                `pairs.${index}.left_image`
                                            ] as string | undefined
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Input
                                        name={`pairs[${index}][right_text]`}
                                        required
                                        onFocus={trackPaletteTarget}
                                        placeholder={`Kanan ${index + 1} (pasangannya)`}
                                        defaultValue={
                                            question?.pairs?.[index]
                                                ?.right_text ?? ""
                                        }
                                    />
                                    <OptionImageFields
                                        fileField={`pairs[${index}][right_image]`}
                                        pathField={`pairs[${index}][right_image_path]`}
                                        removeField={`pairs[${index}][right_remove_image]`}
                                        existingPath={
                                            question?.pairs?.[index]
                                                ?.right_image_path ?? null
                                        }
                                        existingUrl={
                                            question?.pairs?.[index]
                                                ?.right_image_url ?? null
                                        }
                                        error={
                                            errors[
                                                `pairs.${index}.right_image`
                                            ] as string | undefined
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pairCount >= 8}
                            onClick={() =>
                                setPairCount((count) => Math.min(8, count + 1))
                            }
                        >
                            Tambah Pasangan
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pairCount <= 2}
                            onClick={() =>
                                setPairCount((count) => Math.max(2, count - 1))
                            }
                        >
                            Kurangi Pasangan
                        </Button>
                    </div>
                    <InputError
                        message={errors.pairs ?? errors["pairs.0.left_text"]}
                    />
                    <p className="text-xs text-muted-foreground">
                        Siswa memasangkan item kiri dengan item kanan (drag
                        &amp; drop di halaman ujian). Minimal 2, maksimal 8
                        pasangan.
                    </p>
                </div>
            )}

            {type === "essay" && (
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                    Soal esai tidak memiliki pilihan jawaban dan akan dinilai
                    manual oleh guru setelah ujian.
                </p>
            )}

            <div className="grid gap-2">
                <Label htmlFor={id("weight")}>Bobot nilai</Label>
                <Input
                    id={id("weight")}
                    name="weight"
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={question?.weight ?? 1}
                    required
                />
                <InputError message={errors.weight} />
            </div>
        </>
    );
}

/**
 * One option image control: uploads a replacement file or flags the existing one for removal.
 */
function OptionImageInput({
    name,
    existingPath,
    existingUrl,
    error,
}: {
    name: string;
    existingPath: string | null;
    existingUrl: string | null;
    error?: string;
}) {
    return (
        <OptionImageFields
            fileField={`${name}[image]`}
            pathField={`${name}[image_path]`}
            removeField={`${name}[remove_image]`}
            existingPath={existingPath}
            existingUrl={existingUrl}
            error={error}
        />
    );
}

/**
 * Image control with explicit field names — used by options, statements,
 * and the left/right sides of matching pairs.
 */
function OptionImageFields({
    fileField,
    pathField,
    removeField,
    existingPath,
    existingUrl,
    error,
}: {
    fileField: string;
    pathField: string;
    removeField: string;
    existingPath: string | null;
    existingUrl: string | null;
    error?: string;
}) {
    return (
        <ImageUploadField
            fileField={fileField}
            pathField={pathField}
            removeField={removeField}
            existingPath={existingPath}
            existingUrl={existingUrl}
            error={error}
            label="Tambahkan gambar pada pilihan ini"
            compact
        />
    );
}
