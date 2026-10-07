import { useState } from "react";
import { ChevronDown } from "lucide-react";

type PaletteChar = {
    char: string; // karakter yang disisipkan ke teks
    display?: string; // teks yang tampil di tombol (default: char)
    title?: string; // tooltip penjelasan
};
type PaletteGroup = {
    label: string;
    wide?: boolean; // tombol menyesuaikan lebar isi (untuk kata/frasa)
    chars: PaletteChar[];
};

const DA = "\u062F"; // د — huruf contoh untuk harakat
const KA = "ꦏ"; // ꦏ — huruf contoh untuk tanda Jawa

/**
 * Karakter yang sering dibutuhkan guru: simbol matematika, huruf Arab,
 * harakat, kata Arab siap pakai, aksara Jawa (Hanacaraka), dan kata Jawa.
 * Untuk tanda tempel (harakat/tanda Jawa), tombol menampilkan tanda pada
 * huruf contoh (دَ / ꦏꦶ) agar letaknya jelas; yang disisipkan tetap hanya
 * tandanya saja.
 */
const GROUPS: PaletteGroup[] = [
    {
        label: "Matematika",
        chars: "∑ ∏ √ ∫ ≤ ≥ ≠ ≈ ± × ÷ ° ² ³ ∠ Δ α β θ μ σ Ω ½ ⅓ ⅔ ¼ ¾ ∶ ✔ ✗"
            .split(" ")
            .map((char) => ({ char })),
    },
    {
        label: "Huruf Arab",
        chars: "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه ة و ي ء أ إ ؤ ئ"
            .split(" ")
            .map((char) => ({ char })),
    },
    {
        label: "Harakat",
        chars: [
            { char: "\u064E", display: `${DA}\u064E`, title: "Fathah — a" },
            { char: "\u0650", display: `${DA}\u0650`, title: "Kasrah — i" },
            { char: "\u064F", display: `${DA}\u064F`, title: "Dommah — u" },
            {
                char: "\u0651",
                display: `${DA}\u0651`,
                title: "Syaddah — huruf ganda",
            },
            { char: "\u0652", display: `${DA}\u0652`, title: "Sukun — mati" },
            { char: "\u064B", display: `${DA}\u064B`, title: "Fathatain — an" },
            { char: "\u064C", display: `${DA}\u064C`, title: "Dommatain — un" },
            { char: "\u064D", display: `${DA}\u064D`, title: "Kasratain — in" },
            {
                char: "\u0670",
                display: `${DA}\u0670`,
                title: "Alif kecil — aa",
            },
        ],
    },
    {
        label: "Kata Arab",
        wide: true,
        chars: "بِسْمِ اللّٰهِ اَلْحَمْدُ لِلّٰهِ اَللّٰهُ اَكْبَرْ اٰمِيْن مَاشَااءَ اللّٰهِ رَضِيَ اللّٰهُ عَنْهُ اِنْشَاءَ اللّٰهِ"
            .split(" ")
            .map((char) => ({ char })),
    },
    {
        label: "Aksara Jawa",
        chars: "ꦲ ꦤ ꦕ ꦫ ꦏ ꦢ ꦠ ꦱ ꦮ ꦭ ꦥ ꦝ ꦗ ꦪ ꦚ ꦩ ꦒ ꦧ ꦛ ꦔ ꦄ ꦆ ꦈ ꦌ ꦎ"
            .split(" ")
            .map((char) => ({ char })),
    },
    {
        label: "Tanda Jawa",
        chars: [
            { char: "ꦶ", display: `${KA}ꦶ`, title: "Wulu — i" },
            { char: "ꦷ", display: `${KA}ꦷ`, title: "Wulu mahaprana — ii" },
            { char: "ꦸ", display: `${KA}ꦸ`, title: "Suku — u" },
            { char: "ꦹ", display: `${KA}ꦹ`, title: "Suku mandaprana — u" },
            { char: "ꦺ", display: `${KA}ꦺ`, title: "Taling — é" },
            { char: "ꦻ", display: `${KA}ꦻ`, title: "Taling tarung — o" },
            { char: "ꦼ", display: `${KA}ꦼ`, title: "Pepet — e" },
            { char: "ꦾ", display: `${KA}ꦾ`, title: "Cakra — +ya" },
            { char: "ꦿ", display: `${KA}ꦿ`, title: "Pengkal — +ra" },
            { char: "꦳", display: `${KA}꦳`, title: "Cecak telu" },
            { char: "꧀", display: `${KA}꧀`, title: "Pangkon — mati" },
            { char: "ꦁ", display: `${KA}ꦁ`, title: "Candra — ng" },
            { char: "ꦂ", display: `${KA}ꦂ`, title: "Rora — r" },
            { char: "ꦃ", display: `${KA}ꦃ`, title: "Wignyan — h" },
        ],
    },
    {
        label: "Kata Jawa",
        wide: true,
        chars: "ꦲꦤꦕꦫꦏ ꦱꦼꦭꦩꦠ꧀ ꦱꦸꦒꦼꦁ ꦠꦼꦏꦺꦴꦏ꧀ ꦥꦿꦱꦠ꧀ꦪ ꦏꦿꦩ ꦭꦺꦴꦏꦺꦴꦤ꧀ ꦔꦺꦴꦮꦃ ꦲꦶꦏꦶ ꦧꦱꦗꦮ"
            .split(" ")
            .map((char) => ({ char })),
    },
];

/**
 * Panel pilih karakter yang menyisipkan tepat di posisi kursor pada kolom
 * teks yang terakhir diklik (stimulus, pertanyaan, pilihan, pernyataan,
 * pasangan menjodohkan). Kolom didaftarkan lewat getTarget().
 */
export default function SymbolPalette({
    getTarget,
    stickyTopClass,
}: {
    getTarget: () => (HTMLTextAreaElement | HTMLInputElement) | null;
    stickyTopClass?: string;
}) {
    const [open, setOpen] = useState(false);
    const [groupIndex, setGroupIndex] = useState(0);
    const group = GROUPS[groupIndex];

    const insert = (item: PaletteChar) => {
        const target = getTarget();
        if (!target) return;

        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? start;
        target.setRangeText(item.char, start, end, "end");
        target.focus();
        target.selectionStart = target.selectionEnd = start + item.char.length;
        target.dispatchEvent(new Event("input", { bubbles: true }));
    };

    return (
        <div
            className={`rounded-md border bg-card shadow-sm ${
                stickyTopClass ? `sticky ${stickyTopClass} z-30` : ""
            }`}
        >
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
            >
                <span className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 font-serif text-primary">
                        ∑
                    </span>
                    Simbol Matematika, Arab &amp; Hanacaraka
                </span>
                <ChevronDown
                    className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="space-y-2 border-t px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                        Klik dulu ke kolom teks tujuan (stimulus, pertanyaan,
                        pilihan, atau pasangan), posisikan kursor, lalu klik
                        karakter untuk menyisipkan.
                        {group.label === "Harakat" ||
                        group.label === "Tanda Jawa"
                            ? " Tanda disisipkan setelah huruf/aksara yang ditandai kursor."
                            : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {GROUPS.map((item, index) => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => setGroupIndex(index)}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    index === groupIndex
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 rounded-md border bg-background p-2.5">
                        {group.chars.map((item, index) => (
                            <button
                                key={`${item.char}-${index}`}
                                type="button"
                                title={item.title ?? item.char}
                                onClick={() => insert(item)}
                                className={`font-content flex min-h-9 items-center justify-center rounded-md border bg-background py-1 text-lg transition-colors hover:border-primary hover:bg-primary/10 ${
                                    group.wide ? "px-3" : "min-w-9 px-2"
                                }`}
                            >
                                <span dir="auto" className="whitespace-nowrap">
                                    {item.display ?? item.char}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
