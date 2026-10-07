import type { QuestionType } from "@/components/admin/question-form-fields";

export type BankOption = { value: number; label: string };

export type BankQuestionOption = {
    id: number;
    label: string;
    content: string;
    is_correct: boolean;
    image_path: string | null;
    image_url: string | null;
};

export type BankQuestionPair = {
    id: number;
    left_text: string;
    right_text: string;
    left_image_path: string | null;
    left_image_url: string | null;
    right_image_path: string | null;
    right_image_url: string | null;
};

export type BankQuestion = {
    id: number;
    content: string;
    stimulus?: string | null;
    type: QuestionType;
    difficulty: string | null;
    weight: number;
    image_path?: string | null;
    image_url?: string | null;
    /** Terisi di halaman detail bank (mode detailed) untuk modal edit. */
    options?: BankQuestionOption[];
    pairs?: BankQuestionPair[];
};

export type QuestionBank = {
    id: number;
    name: string;
    subject: string;
    subject_id: number;
    school_class_id: number | null;
    class: string | null;
    teacher_id?: number | null;
    teacher?: string | null;
    material: string | null;
    questions_count: number;
    questions: BankQuestion[];
};

type BankFormDefinition = {
    action: string;
    method: "get" | "post" | "put" | "patch" | "delete";
};

export type QuestionBankControllerApi = {
    store: { form: () => BankFormDefinition };
    storeBank: { form: () => BankFormDefinition };
    updateBank: { form: (id: number) => BankFormDefinition };
    destroyBank: { url: (id: number) => string };
    showBank: { url: (id: number) => string };
    show: { url: (id: number) => string };
    update: { form: (id: number) => BankFormDefinition };
};

export const DIFFICULTY_VARIANT: Record<
    string,
    "secondary" | "default" | "destructive"
> = {
    Mudah: "secondary",
    Sedang: "default",
    Sulit: "destructive",
};

export const SHORT_TYPE_LABELS: Record<QuestionType, string> = {
    multiple_choice: "Pilihan Ganda",
    multiple_answers: "PG Kompleks",
    true_false: "Benar/Salah",
    statement_true_false: "Menjodohkan (B/S)",
    matching: "Menjodohkan",
    essay: "Esai",
};

/** "Pilihan Ganda 12 · Esai 5" — types present in the list, in fixed order. */
export function compositionText(questions: BankQuestion[]): string {
    return (Object.entries(SHORT_TYPE_LABELS) as [QuestionType, string][])
        .map(([type, label]) => {
            const count = questions.filter(
                (question) => question.type === type,
            ).length;
            return count > 0 ? `${label} ${count}` : null;
        })
        .filter((text): text is string => text !== null)
        .join(" · ");
}
