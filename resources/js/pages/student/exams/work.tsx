import { Head, router } from "@inertiajs/react";
import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flag,
    Lock,
    Maximize,
    Send,
    Shield,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AppLogoIcon from "@/components/app-logo-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    answer as answerRoute,
    security as securityRoute,
    submit as submitRoute,
} from "@/routes/student/exams";

type QuestionType =
    | "multiple_choice"
    | "multiple_answers"
    | "true_false"
    | "statement_true_false"
    | "matching"
    | "essay";
type Option = { id: number; content: string; image_url: string | null };
type WorkQuestion = {
    id: number;
    content: string;
    stimulus: string | null;
    type: QuestionType;
    weight: number;
    image_url: string | null;
    options: Option[];
    pairs: { id: number; left_text: string; left_image_url: string | null }[];
    right_pool: { text: string; image_url: string | null }[];
};
type SessionInfo = {
    id: number;
    exam_name: string;
    subject: string;
    server_time: number;
    deadline: number;
    locked: boolean;
    locked_reason: string | null;
    started_at_label: string;
    violation_flag_threshold: number;
};
type AnswerValue = Record<string, unknown>;

const TYPE_HINTS: Partial<Record<QuestionType, string>> = {
    multiple_choice: "Pilih satu jawaban yang paling benar.",
    multiple_answers:
        "Centang semua jawaban yang benar (bisa lebih dari satu).",
    true_false: "Pilih Benar atau Salah.",
    statement_true_false: "Nilai setiap pernyataan: Benar atau Salah.",
    matching: "Klik item di kolom kiri, lalu klik pasangannya di kolom kanan.",
    essay: "Tulis jawabanmu dengan kalimat yang jelas.",
};

function formatClock(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function StudentExamWork({
    session,
    questions,
    answers: initialAnswers,
}: {
    session: SessionInfo;
    questions: WorkQuestion[];
    answers: Record<string, AnswerValue | null>;
}) {
    const clockOffset = useRef(session.server_time - Date.now());
    const [remaining, setRemaining] = useState(
        () => session.deadline - (Date.now() + clockOffset.current),
    );
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<number, AnswerValue | null>>(
        () =>
            Object.fromEntries(
                Object.entries(initialAnswers).map(([key, value]) => [
                    Number(key),
                    value,
                ]),
            ),
    );
    const [flagged, setFlagged] = useState<Set<number>>(() => {
        try {
            return new Set(
                JSON.parse(
                    localStorage.getItem(`cbt-flagged-${session.id}`) ?? "[]",
                ) as number[],
            );
        } catch {
            return new Set<number>();
        }
    });
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
        "idle",
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [locked, setLocked] = useState(session.locked);
    const submittedRef = useRef(false);
    const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
        {},
    );
    const blurAtRef = useRef<number | null>(null);
    const lastViolationNoticeRef = useRef(0);
    const fullscreenSupported =
        typeof document !== "undefined" &&
        typeof document.documentElement.requestFullscreen === "function";

    const submit = useCallback(() => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        // Ujian selesai → keluar otomatis dari mode layar penuh.
        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
        }
        router.post(submitRoute.url({ session: session.id }));
    }, [session.id]);

    const reportSecurity = useCallback(
        (type: string, metadata: Record<string, unknown> = {}) => {
            if (submittedRef.current) return Promise.resolve(null);
            return fetch(securityRoute.url({ session: session.id }), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement | null
                        )?.content ?? "",
                    Accept: "application/json",
                },
                body: JSON.stringify({ type, metadata }),
            })
                .then((response) => (response.ok ? response.json() : null))
                .then((data) => {
                    // Sistem mengunci ujian otomatis saat pelanggaran melewati batas.
                    if (data?.locked) setLocked(true);
                    return data;
                })
                .catch(() => null);
        },
        [session.id],
    );

    useEffect(() => {
        const onBlur = () => {
            blurAtRef.current ??= Date.now();
            void reportSecurity("WINDOW_BLUR");
        };
        const onFocus = () => {
            const blurAt = blurAtRef.current;
            blurAtRef.current = null;
            void reportSecurity(
                "WINDOW_FOCUS",
                blurAt !== null ? { duration_ms: Date.now() - blurAt } : {},
            );
        };
        const onFullscreenChange = () => {
            if (document.fullscreenElement) {
                setFocusMode(true);
                void reportSecurity("FULLSCREEN_ENTER");
            } else {
                setFocusMode(false);
                void reportSecurity("FULLSCREEN_EXIT", {
                    hint: "keluar dari mode layar penuh",
                }).then((data) => {
                    const count = data?.violation_count;
                    if (
                        typeof count !== "number" ||
                        count < session.violation_flag_threshold ||
                        lastViolationNoticeRef.current === count
                    ) {
                        return;
                    }
                    lastViolationNoticeRef.current = count;
                    toast.warning(
                        `Kamu sudah ${count}× keluar dari mode ujian. Pelanggaran ini dicatat untuk pengawas.`,
                    );
                });
            }
        };
        const onVisibility = () => {
            if (document.hidden) {
                blurAtRef.current ??= Date.now();
                void reportSecurity("WINDOW_BLUR", { via: "visibilitychange" });
            }
        };
        const onCopy = (event: Event) => {
            event.preventDefault();
            void reportSecurity("COPY_ATTEMPT");
        };
        const onPaste = (event: Event) => {
            event.preventDefault();
            void reportSecurity("PASTE_BLOCKED");
        };
        const onContextMenu = (event: Event) => event.preventDefault();

        window.addEventListener("blur", onBlur);
        window.addEventListener("focus", onFocus);
        document.addEventListener("fullscreenchange", onFullscreenChange);
        document.addEventListener("visibilitychange", onVisibility);
        document.addEventListener("copy", onCopy);
        document.addEventListener("paste", onPaste);
        document.addEventListener("contextmenu", onContextMenu);
        return () => {
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener(
                "fullscreenchange",
                onFullscreenChange,
            );
            document.removeEventListener("visibilitychange", onVisibility);
            document.removeEventListener("copy", onCopy);
            document.removeEventListener("paste", onPaste);
            document.removeEventListener("contextmenu", onContextMenu);
        };
    }, [reportSecurity, session.violation_flag_threshold]);

    const enterExamMode = () => {
        document.documentElement.requestFullscreen?.().catch(() => {});
    };

    useEffect(() => {
        if (fullscreenSupported && !document.fullscreenElement) {
            enterExamMode();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const left = session.deadline - (Date.now() + clockOffset.current);
            setRemaining(left);
            if (left <= 0) submit();
        }, 1000);
        return () => clearInterval(timer);
    }, [session.deadline, submit]);

    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => {
            if (!submittedRef.current) event.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    const persist = useCallback(
        (questionId: number, value: AnswerValue | null) => {
            setSaveState("saving");
            clearTimeout(saveTimers.current[questionId]);
            saveTimers.current[questionId] = setTimeout(() => {
                fetch(answerRoute.url({ session: session.id }), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN":
                            (
                                document.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content ?? "",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ question_id: questionId, value }),
                })
                    .then((response) =>
                        response.ok
                            ? response.json()
                            : response
                                  .json()
                                  .catch(() => null)
                                  .then((body) =>
                                      Promise.reject({
                                          status: response.status,
                                          reason: body?.reason ?? null,
                                      }),
                                  ),
                    )
                    .then(() => setSaveState("saved"))
                    .catch(
                        ({
                            status,
                            reason,
                        }: {
                            status?: number;
                            reason?: string | null;
                        } = {}) => {
                            if (status === 409 && reason === "locked") {
                                setLocked(true);
                            } else if (status === 409) {
                                submit();
                            } else {
                                setSaveState("idle");
                            }
                        },
                    );
            }, 500);
        },
        [session.id, submit],
    );

    const setAnswer = (questionId: number, value: AnswerValue | null) => {
        setAnswers((current) => ({ ...current, [questionId]: value }));
        persist(questionId, value);
    };

    const toggleFlag = (questionId: number) => {
        setFlagged((current) => {
            const next = new Set(current);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            localStorage.setItem(
                `cbt-flagged-${session.id}`,
                JSON.stringify([...next]),
            );
            return next;
        });
    };

    const question = questions[current];
    const answeredCount = questions.filter(
        (q) =>
            answers[q.id] !== undefined &&
            answers[q.id] !== null &&
            !isEmptyAnswer(answers[q.id]),
    ).length;
    const unansweredCount = questions.length - answeredCount;
    const lowTime = remaining <= 5 * 60 * 1000;

    return (
        <>
            <Head title={session.exam_name} />

            {/* Overlay fullscreen gate */}
            {fullscreenSupported && !focusMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 text-center shadow-2xl">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Maximize className="size-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">
                                Mode Layar Penuh Diperlukan
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Demi keamanan ujian, pengerjaan harus dilakukan
                                dalam mode layar penuh. Setiap kali keluar dari
                                mode ini akan dicatat sebagai pelanggaran oleh
                                pengawas.
                            </p>
                        </div>
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2 text-left">
                            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Copy-paste, klik kanan, dan berpindah tab juga
                                direkam oleh sistem pengawas.
                            </p>
                        </div>
                        <Button
                            className="w-full h-11 text-base font-semibold"
                            onClick={enterExamMode}
                        >
                            <Maximize className="size-4 mr-2" />
                            Masuk Mode Ujian
                        </Button>
                    </div>
                </div>
            )}

            {/* Overlay ujian terkunci karena kecurangan */}
            {locked && !submittedRef.current && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-destructive/5 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md space-y-6 rounded-2xl border-2 border-destructive bg-card p-8 text-center shadow-2xl">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <Lock className="size-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-destructive">
                                Ujian Terkunci
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Ujian kamu dikunci karena sistem mendeteksi
                                pelanggaran keamanan yang berulang. Beritahu
                                pengawas/guru kamu — hanya guru yang membuat
                                ujian ini yang dapat membukanya.
                            </p>
                        </div>
                        {session.locked_reason && (
                            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                                {session.locked_reason}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Halaman akan terbuka otomatis setelah guru membuka
                            kuncinya.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.reload()}
                        >
                            Periksa Kembali
                        </Button>
                    </div>
                </div>
            )}

            {/* Top bar */}
            <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-card/95 backdrop-blur px-4 shadow-sm">
                {/* Kiri: logo + info ujian */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <AppLogoIcon className="size-4 fill-current" />
                    </div>
                    <div className="hidden sm:block min-w-0">
                        <p className="truncate text-sm font-semibold leading-none">
                            {session.exam_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                            {session.subject}
                        </p>
                    </div>
                </div>

                {/* Tengah: progress modern */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs">
                        <span className="text-muted-foreground font-medium">Progres:</span>
                        <span className="font-semibold text-foreground">
                            {answeredCount}/{questions.length}
                        </span>
                        <span className="text-muted-foreground font-medium">
                            ({Math.round((answeredCount / questions.length) * 100)}%)
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.round((answeredCount / questions.length) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                    {flagged.size > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Flag className="size-3" />
                            {flagged.size} ditandai
                        </span>
                    )}
                </div>

                {/* Kanan: save state + timer + security badge */}
                <div className="flex items-center gap-3">
                    {saveState !== "idle" && (
                        <span
                            className={`hidden sm:inline text-xs ${saveState === "saved" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}
                        >
                            {saveState === "saving"
                                ? "Menyimpan…"
                                : "✓ Tersimpan"}
                        </span>
                    )}
                    <div
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${lowTime ? "bg-destructive/10 text-destructive" : "bg-muted"}`}
                    >
                        <Clock
                            className={`size-3.5 shrink-0 ${lowTime ? "animate-pulse" : ""}`}
                        />
                        {formatClock(remaining)}
                    </div>
                    {focusMode && (
                        <div className="hidden sm:flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                            <Shield className="size-3" />
                            Aman
                        </div>
                    )}
                </div>
            </header>

            {/* Aksen garis progress modern */}
            <div className="sticky top-14 z-10 h-1 w-full bg-muted/50 overflow-hidden">
                <div
                    className="h-full bg-linear-to-r from-primary via-emerald-500 to-teal-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{
                        width: `${Math.round((answeredCount / questions.length) * 100)}%`,
                    }}
                />
            </div>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Area soal */}
                <main className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
                    <div
                        className={`mx-auto w-full flex flex-col gap-5 flex-1 ${
                            question?.stimulus ? "max-w-6xl" : "max-w-3xl"
                        }`}
                    >
                        {question && (
                            <div
                                className={
                                    question.stimulus
                                        ? "grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch flex-1"
                                        : "flex flex-col flex-1"
                                }
                            >
                                {question.stimulus && (
                                    <Card className="flex flex-col overflow-hidden border-border/70 shadow-xs h-full">
                                        <div className="flex h-12 shrink-0 items-center justify-between border-b bg-muted/30 px-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <BookOpen className="size-4 text-primary" />
                                                <span>Wacana / Stimulus</span>
                                            </div>
                                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                                                Bahan Bacaan
                                            </span>
                                        </div>
                                        <CardContent className="flex-1 p-5 text-sm md:text-base leading-relaxed whitespace-pre-wrap max-h-[60vh] lg:max-h-[calc(100vh-270px)] overflow-y-auto">
                                            {question.stimulus}
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="flex flex-col overflow-hidden border-border/70 shadow-xs h-full">
                                    <div className="flex h-12 shrink-0 items-center justify-between border-b bg-muted/30 px-4">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                                                {current + 1}
                                            </span>
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                Soal Nomor {current + 1}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                flagged.has(question.id)
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className={`h-7 px-2.5 text-xs gap-1.5 transition-all ${
                                                flagged.has(question.id)
                                                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs"
                                                    : "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 dark:hover:bg-amber-950/30 dark:hover:border-amber-700"
                                            }`}
                                            onClick={() =>
                                                toggleFlag(question.id)
                                            }
                                        >
                                            <Flag
                                                className={`size-3.5 ${flagged.has(question.id) ? "fill-white" : ""}`}
                                            />
                                            <span>
                                                {flagged.has(question.id)
                                                    ? "Ragu-ragu"
                                                    : "Tandai Ragu"}
                                            </span>
                                        </Button>
                                    </div>
                                    <CardContent className="flex-1 space-y-5 p-5 max-h-[60vh] lg:max-h-[calc(100vh-270px)] overflow-y-auto">
                                        <p className="text-base font-medium leading-relaxed whitespace-pre-wrap text-foreground">
                                            {question.content}
                                        </p>

                                        {question.image_url && (
                                            <img
                                                src={question.image_url}
                                                alt="Gambar soal"
                                                className="max-h-72 rounded-lg border object-contain"
                                            />
                                        )}

                                        <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
                                            {TYPE_HINTS[question.type]}
                                        </div>

                                        <QuestionInput
                                            question={question}
                                            value={answers[question.id] ?? null}
                                            onChange={(value) =>
                                                setAnswer(question.id, value)
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Navigasi bawah soal */}
                        <div className="flex items-center justify-between gap-3 pt-1 pb-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 px-4 rounded-xl text-xs sm:text-sm font-medium"
                                disabled={current === 0}
                                onClick={() =>
                                    setCurrent((i) => Math.max(0, i - 1))
                                }
                            >
                                <ChevronLeft className="size-4 mr-1" />
                                Sebelumnya
                            </Button>

                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-full bg-muted/40 border">
                                Soal <strong>{current + 1}</strong> dari <strong>{questions.length}</strong>
                            </div>

                            {current < questions.length - 1 ? (
                                <Button
                                    type="button"
                                    className="h-10 px-4 rounded-xl text-xs sm:text-sm font-medium"
                                    onClick={() =>
                                        setCurrent((i) =>
                                            Math.min(
                                                questions.length - 1,
                                                i + 1,
                                            ),
                                        )
                                    }
                                >
                                    Berikutnya
                                    <ChevronRight className="size-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => setConfirmOpen(true)}
                                    className="h-10 px-5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                >
                                    <Send className="size-4 mr-1.5" />
                                    Selesai & Kumpulkan
                                </Button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Sidebar navigasi soal (desktop) */}
                {/* Sidebar navigasi soal (desktop) */}
                <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l bg-card overflow-y-auto">
                    {/* Header Navigasi */}
                    <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Navigasi Soal
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            {current + 1} / {questions.length}
                        </span>
                    </div>

                    <div className="p-4 flex flex-col gap-4 flex-1">
                        {/* Modern Progress Card in Sidebar */}
                        <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-muted-foreground">Kemajuan Pengerjaan</span>
                                <span className="font-bold text-foreground">
                                    {Math.round((answeredCount / questions.length) * 100)}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-primary to-emerald-500 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${Math.round((answeredCount / questions.length) * 100)}%`,
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[11px]">
                                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-1 px-1">
                                    <span className="block font-bold text-emerald-600 dark:text-emerald-400">
                                        {answeredCount}
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">Dijawab</span>
                                </div>
                                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 py-1 px-1">
                                    <span className="block font-bold text-amber-600 dark:text-amber-400">
                                        {flagged.size}
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">Ragu</span>
                                </div>
                                <div className="rounded-lg bg-muted/60 border border-border/40 py-1 px-1">
                                    <span className="block font-bold text-muted-foreground">
                                        {unansweredCount}
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">Kosong</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid nomor soal */}
                        <div className="space-y-1.5">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Daftar Nomor Soal
                            </p>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, index) => {
                                    const answered =
                                        answers[q.id] !== undefined &&
                                        answers[q.id] !== null &&
                                        !isEmptyAnswer(answers[q.id]);
                                    const isCurrent = index === current;
                                    const isFlagged = flagged.has(q.id);

                                    return (
                                        <button
                                            key={q.id}
                                            type="button"
                                            onClick={() => setCurrent(index)}
                                            title={`Soal ${index + 1}${answered ? " (terjawab)" : ""}${isFlagged ? " (ragu-ragu)" : ""}`}
                                            className={`relative size-10 rounded-xl text-xs font-semibold transition-all flex items-center justify-center ${
                                                isCurrent
                                                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10"
                                                    : isFlagged
                                                      ? "bg-amber-500/15 border border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-500/25"
                                                      : answered
                                                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/25"
                                                        : "bg-muted/40 hover:bg-muted text-muted-foreground border border-border/50 hover:text-foreground"
                                            }`}
                                        >
                                            {index + 1}
                                            {isFlagged && (
                                                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legenda Modern */}
                        <div className="rounded-xl border bg-muted/10 p-3 space-y-2 text-xs">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Keterangan
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2.5 rounded-full bg-primary ring-2 ring-primary/20 shrink-0" />
                                    <span>Soal aktif</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>Sudah dijawab</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>Ragu-ragu</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                    <span>Belum dijawab</span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol kumpulkan */}
                        <div className="mt-auto pt-2">
                            <Button
                                type="button"
                                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                                onClick={() => setConfirmOpen(true)}
                            >
                                <Send className="size-4 mr-2" />
                                Kumpulkan Ujian
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Navigasi soal bawah layar (mobile/tablet) */}
            <div className="lg:hidden border-t bg-card px-4 py-2.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="font-medium">Navigasi Soal</span>
                    <span className="font-semibold text-foreground">
                        {answeredCount}/{questions.length} Selesai ({Math.round((answeredCount / questions.length) * 100)}%)
                    </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {questions.map((q, index) => {
                        const answered =
                            answers[q.id] !== undefined &&
                            answers[q.id] !== null &&
                            !isEmptyAnswer(answers[q.id]);
                        const isCurrent = index === current;
                        const isFlagged = flagged.has(q.id);
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => setCurrent(index)}
                                className={`size-9 shrink-0 rounded-xl text-xs font-semibold transition-all flex items-center justify-center relative ${
                                    isCurrent
                                        ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 ring-2 ring-primary ring-offset-2 scale-105"
                                        : isFlagged
                                          ? "bg-amber-500/15 border border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold"
                                          : answered
                                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                                            : "bg-muted text-muted-foreground border border-transparent"
                                }`}
                            >
                                {index + 1}
                                {isFlagged && (
                                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dialog konfirmasi kumpulkan */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kumpulkan ujian?</DialogTitle>
                        <DialogDescription>
                            {unansweredCount > 0
                                ? `Masih ada ${unansweredCount} soal belum terjawab. Jawaban yang sudah tersimpan akan dinilai.`
                                : "Semua soal sudah terjawab. Jawaban akan dinilai otomatis."}
                        </DialogDescription>
                    </DialogHeader>
                    {unansweredCount > 0 && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2 text-sm">
                            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span className="text-amber-700 dark:text-amber-300">
                                Soal yang tidak dijawab tidak mendapat nilai.
                                Pastikan kamu sudah memeriksa semua soal.
                            </span>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Periksa Lagi
                        </Button>
                        <Button
                            onClick={submit}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Send className="size-4 mr-1.5" />
                            Ya, Kumpulkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function isEmptyAnswer(value: AnswerValue | null): boolean {
    if (value === null) return true;
    if ("text" in value) return !value.text || String(value.text).trim() === "";
    if ("option_id" in value)
        return value.option_id === null || value.option_id === undefined;
    if ("option_ids" in value)
        return (
            !Array.isArray(value.option_ids) || value.option_ids.length === 0
        );
    if ("judgments" in value)
        return Object.keys(value.judgments ?? {}).length === 0;
    if ("matches" in value)
        return Object.keys(value.matches ?? {}).length === 0;
    return true;
}

// Warna pasangan yang konsisten berdasarkan index
const PAIR_COLORS = [
    "bg-blue-100 dark:bg-blue-900/40 border-blue-400 text-blue-800 dark:text-blue-200",
    "bg-violet-100 dark:bg-violet-900/40 border-violet-400 text-violet-800 dark:text-violet-200",
    "bg-rose-100 dark:bg-rose-900/40 border-rose-400 text-rose-800 dark:text-rose-200",
    "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-800 dark:text-amber-200",
    "bg-teal-100 dark:bg-teal-900/40 border-teal-400 text-teal-800 dark:text-teal-200",
    "bg-fuchsia-100 dark:bg-fuchsia-900/40 border-fuchsia-400 text-fuchsia-800 dark:text-fuchsia-200",
    "bg-cyan-100 dark:bg-cyan-900/40 border-cyan-400 text-cyan-800 dark:text-cyan-200",
    "bg-lime-100 dark:bg-lime-900/40 border-lime-400 text-lime-800 dark:text-lime-200",
];

function MatchingInput({
    question,
    value,
    onChange,
}: {
    question: WorkQuestion;
    value: AnswerValue | null;
    onChange: (value: AnswerValue | null) => void;
}) {
    const matches =
        (value?.matches as Record<string, string> | undefined) ?? {};
    const [activePairId, setActivePairId] = useState<number | null>(null);

    // Reverse map: right_text -> pair_id
    const usedRight = new Set(Object.values(matches));
    // Map: right_text -> pair index (for color)
    const rightToColor: Record<string, number> = {};
    question.pairs.forEach((pair, idx) => {
        const matched = matches[pair.id] ?? matches[String(pair.id)];
        if (matched) rightToColor[matched] = idx;
    });

    const handleLeftClick = (pairId: number) => {
        if (activePairId === pairId) {
            setActivePairId(null);
        } else {
            setActivePairId(pairId);
        }
    };

    const handleRightClick = (text: string) => {
        if (activePairId === null) return;

        const next = { ...matches };
        // Batalkan pasangan lama jika text ini sudah dipakai pair lain
        const existingPair = question.pairs.find(
            (p) => (next[p.id] ?? next[String(p.id)]) === text,
        );
        if (existingPair) {
            delete next[existingPair.id];
            delete next[String(existingPair.id)];
        }
        // Jika klik yang sama dengan yang sudah terpasang => hapus
        const currentMatch = next[activePairId] ?? next[String(activePairId)];
        if (currentMatch === text) {
            delete next[activePairId];
            delete next[String(activePairId)];
        } else {
            next[activePairId] = text;
        }
        onChange({ matches: next });
        setActivePairId(null);
    };

    const clearMatch = (pairId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = { ...matches };
        delete next[pairId];
        delete next[String(pairId)];
        onChange({ matches: next });
        setActivePairId(null);
    };

    const isActive = activePairId !== null;

    return (
        <div className="space-y-3">
            {/* Instruksi kontekstual */}
            {isActive && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/8 dark:bg-primary/15 border border-primary/30 px-3 py-2 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="size-2 rounded-full bg-primary animate-pulse shrink-0" />
                    Pilih pasangan di kolom kanan, atau klik item yang sama
                    untuk membatalkan
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {/* Kolom Kiri */}
                <div className="space-y-2">
                    <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b">
                        Item
                    </p>
                    {question.pairs.map((pair, index) => {
                        const matched =
                            matches[pair.id] ?? matches[String(pair.id)];
                        const isSelected = activePairId === pair.id;
                        const colorClass = matched
                            ? PAIR_COLORS[index % PAIR_COLORS.length]
                            : "";

                        return (
                            <button
                                key={pair.id}
                                type="button"
                                onClick={() => handleLeftClick(pair.id)}
                                className={[
                                    "w-full text-left rounded-xl border-2 px-3 py-2.5 text-sm transition-all duration-150",
                                    isSelected
                                        ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-md ring-2 ring-primary/30 scale-[1.02]"
                                        : matched
                                          ? `border ${colorClass} hover:opacity-90`
                                          : "border-border bg-background hover:border-primary/50 hover:bg-muted/40",
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={`shrink-0 flex size-5 items-center justify-center rounded-full text-xs font-bold ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                                        >
                                            {index + 1}
                                        </span>
                                        {pair.left_image_url && (
                                            <img
                                                src={pair.left_image_url}
                                                alt={`Item ${index + 1}`}
                                                className="max-h-10 rounded border object-contain"
                                            />
                                        )}
                                        <span className="font-medium leading-snug">
                                            {pair.left_text}
                                        </span>
                                    </div>
                                    {matched && (
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                clearMatch(pair.id, e)
                                            }
                                            className="shrink-0 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                            title="Hapus pasangan"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    )}
                                </div>
                                {matched && (
                                    <p
                                        className={`mt-1 text-xs truncate font-medium opacity-70`}
                                    >
                                        → {matched}
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Kolom Kanan */}
                <div className="space-y-2">
                    <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b">
                        Pasangan
                    </p>
                    {question.right_pool.map((poolItem) => {
                        const colorIndex = rightToColor[poolItem.text];
                        const isUsed = usedRight.has(poolItem.text);
                        const usedByActive =
                            activePairId !== null &&
                            (matches[activePairId] ??
                                matches[String(activePairId)]) ===
                                poolItem.text;
                        const colorClass = isUsed
                            ? PAIR_COLORS[colorIndex % PAIR_COLORS.length]
                            : "";

                        return (
                            <button
                                key={poolItem.text}
                                type="button"
                                onClick={() => handleRightClick(poolItem.text)}
                                disabled={!isActive && !isUsed}
                                className={[
                                    "w-full text-left rounded-xl border-2 px-3 py-2.5 text-sm transition-all duration-150",
                                    isActive
                                        ? usedByActive
                                            ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-md scale-[1.02]"
                                            : "border-border hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
                                        : isUsed
                                          ? `border ${colorClass}`
                                          : "border-dashed border-border bg-muted/20 opacity-50 cursor-not-allowed",
                                ].join(" ")}
                            >
                                <div className="flex items-center gap-2">
                                    {isUsed && !isActive && (
                                        <CheckCircle2 className="size-3.5 shrink-0 opacity-60" />
                                    )}
                                    {isActive && !isUsed && (
                                        <div className="size-3.5 shrink-0 rounded-full border-2 border-current opacity-40" />
                                    )}
                                    {poolItem.image_url && (
                                        <img
                                            src={poolItem.image_url}
                                            alt={poolItem.text}
                                            className="max-h-10 shrink-0 rounded border object-contain"
                                        />
                                    )}
                                    <span
                                        className={`font-medium leading-snug ${!isActive && !isUsed ? "opacity-50" : ""}`}
                                    >
                                        {poolItem.text}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Progress pasangan */}
            {question.pairs.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{
                                width: `${(Object.keys(matches).length / question.pairs.length) * 100}%`,
                            }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {Object.keys(matches).length}/{question.pairs.length}{" "}
                        terpasang
                    </span>
                </div>
            )}
        </div>
    );
}

function QuestionInput({
    question,
    value,
    onChange,
}: {
    question: WorkQuestion;
    value: AnswerValue | null;
    onChange: (value: AnswerValue | null) => void;
}) {
    if (question.type === "multiple_choice" || question.type === "true_false") {
        const selected = (value?.option_id as number | undefined) ?? null;
        return (
            <div className="space-y-2">
                {question.options.map((option, index) => (
                    <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5 ${
                            selected === option.id
                                ? "border-primary bg-primary/8 dark:bg-primary/15"
                                : "border-border"
                        }`}
                    >
                        <input
                            type="radio"
                            name={`option-${question.id}`}
                            checked={selected === option.id}
                            onChange={() => onChange({ option_id: option.id })}
                            className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="font-semibold mr-1">
                                {String.fromCharCode(65 + index)}.
                            </span>
                            {option.content}
                        </span>
                        {option.image_url && (
                            <img
                                src={option.image_url}
                                alt={`Pilihan ${String.fromCharCode(65 + index)}`}
                                className="max-h-16 rounded border object-contain"
                            />
                        )}
                    </label>
                ))}
            </div>
        );
    }

    if (question.type === "multiple_answers") {
        const selected = new Set(
            ((value?.option_ids as number[] | undefined) ?? []).map(Number),
        );
        return (
            <div className="space-y-2">
                {question.options.map((option, index) => (
                    <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5 ${
                            selected.has(option.id)
                                ? "border-primary bg-primary/8 dark:bg-primary/15"
                                : "border-border"
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={selected.has(option.id)}
                            onChange={() => {
                                const next = new Set(selected);
                                if (next.has(option.id)) {
                                    next.delete(option.id);
                                } else {
                                    next.add(option.id);
                                }
                                onChange({ option_ids: [...next] });
                            }}
                            className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="font-semibold mr-1">
                                {String.fromCharCode(65 + index)}.
                            </span>
                            {option.content}
                        </span>
                        {option.image_url && (
                            <img
                                src={option.image_url}
                                alt={`Pilihan ${String.fromCharCode(65 + index)}`}
                                className="max-h-16 rounded border object-contain"
                            />
                        )}
                    </label>
                ))}
            </div>
        );
    }

    if (question.type === "statement_true_false") {
        const judgments =
            (value?.judgments as Record<string, boolean> | undefined) ?? {};
        return (
            <div className="divide-y rounded-lg border overflow-hidden">
                {question.options.map((option, index) => (
                    <div
                        key={option.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-3.5 hover:bg-muted/30"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <p className="min-w-0 flex-1 text-sm">
                                <span className="font-semibold mr-1">
                                    {index + 1}.
                                </span>
                                {option.content}
                            </p>
                            {option.image_url && (
                                <img
                                    src={option.image_url}
                                    alt={`Gambar pernyataan ${index + 1}`}
                                    className="max-h-14 rounded border object-contain"
                                />
                            )}
                        </div>
                        <div className="flex gap-3 text-sm">
                            {[true, false].map((isTrue) => (
                                <label
                                    key={String(isTrue)}
                                    className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1 transition-colors ${
                                        (judgments[option.id] ??
                                            judgments[String(option.id)] ??
                                            null) === isTrue
                                            ? "border-primary bg-primary/10 text-primary font-semibold"
                                            : "hover:bg-muted"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={`statement-${question.id}-${option.id}`}
                                        checked={
                                            (judgments[option.id] ??
                                                judgments[String(option.id)] ??
                                                null) === isTrue
                                        }
                                        onChange={() =>
                                            onChange({
                                                judgments: {
                                                    ...judgments,
                                                    [option.id]: isTrue,
                                                },
                                            })
                                        }
                                        className="sr-only"
                                    />
                                    {isTrue ? "Benar" : "Salah"}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (question.type === "matching") {
        return (
            <MatchingInput
                question={question}
                value={value}
                onChange={onChange}
            />
        );
    }

    const text = (value?.text as string | undefined) ?? "";
    return (
        <textarea
            rows={8}
            value={text}
            onChange={(event) => onChange({ text: event.target.value })}
            placeholder="Tulis jawabanmu di sini…"
            className="w-full rounded-lg border border-input bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
    );
}
