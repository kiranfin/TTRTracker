// src/theme/colorUtils.ts

export const DEFAULT_ACCENT_COLOR = '#2563eb';

const LEGACY_ACCENTS: Record<string, string> = {
    default: '#f3f4f6',
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#ea580c',
    pink: '#db2777',
};

export function normalizeHexColor(value?: string | null) {
    if (!value) return DEFAULT_ACCENT_COLOR;

    const trimmed = value.trim();

    if (LEGACY_ACCENTS[trimmed]) {
        return LEGACY_ACCENTS[trimmed];
    }

    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
        return trimmed.toLowerCase();
    }

    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
        const r = trimmed[1];
        const g = trimmed[2];
        const b = trimmed[3];

        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return DEFAULT_ACCENT_COLOR;
}

function hexToRgb(hex: string) {
    const normalized = normalizeHexColor(hex).replace('#', '');

    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}

function srgbToLinear(value: number) {
    const normalized = value / 255;

    return normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string) {
    const { r, g, b } = hexToRgb(hex);

    const red = srgbToLinear(r);
    const green = srgbToLinear(g);
    const blue = srgbToLinear(b);

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getContrastRatio(colorA: string, colorB: string) {
    const luminanceA = getRelativeLuminance(colorA);
    const luminanceB = getRelativeLuminance(colorB);

    const lighter = Math.max(luminanceA, luminanceB);
    const darker = Math.min(luminanceA, luminanceB);

    return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(backgroundColor: string) {
    const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
    const darkContrast = getContrastRatio('#111827', backgroundColor);

    return whiteContrast >= darkContrast ? '#ffffff' : '#111827';
}

export function withAlpha(hex: string, alpha: number) {
    const { r, g, b } = hexToRgb(hex);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}