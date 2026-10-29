import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

// Merged from the Stitch exports. Screens that used a conflicting palette got
// prefixed tokens during conversion: po-* (Precision Operations palette and its
// sharper radii, rounded-po*), cm-* (campaigns), ps-brand-* (pacing & safety).
const config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "surface-container-lowest": "#ffffff",
        "error-container": "#fee2e2",
        "surface-bright": "#f8fafc",
        "primary-fixed-dim": "#cbd5e1",
        "inverse-on-surface": "#f1f5f9",
        "tertiary-fixed-dim": "#a5f3fc",
        "on-primary-container": "#94a3b8",
        "on-error-container": "#991b1b",
        "on-surface": "#0f172a",
        "secondary-fixed-dim": "#c7d2fe",
        "secondary-container": "#4f46e5",
        "surface-dim": "#e2e8f0",
        "secondary-fixed": "#e0e7ff",
        "on-tertiary-fixed": "#083344",
        outline: "#64748b",
        "surface-container-highest": "#e2e8f0",
        "on-secondary-fixed-variant": "#3730a3",
        "on-tertiary": "#ffffff",
        background: "#f8fafc",
        "on-background": "#0f172a",
        "inverse-primary": "#94a3b8",
        "tertiary-fixed": "#cffafe",
        "on-primary-fixed": "#0f172a",
        "on-error": "#ffffff",
        "primary-container": "#0f172a",
        "inverse-surface": "#1e293b",
        "surface-container-high": "#e8edfb",
        tertiary: "#0e7490",
        error: "#ef4444",
        "surface-tint": "#4f46e5",
        "on-secondary-fixed": "#1e1b4b",
        "on-primary": "#ffffff",
        "surface-container-low": "#f1f5f9",
        "on-tertiary-fixed-variant": "#155e75",
        "tertiary-container": "#164e63",
        "on-tertiary-container": "#0891b2",
        "on-secondary-container": "#ffffff",
        surface: "#f8fafc",
        "surface-container": "#f1f5f9",
        "on-secondary": "#ffffff",
        "outline-variant": "#cbd5e1",
        "on-surface-variant": "#475569",
        "on-primary-fixed-variant": "#334155",
        "primary-fixed": "#e2e8f0",
        secondary: "#4f46e5",
        primary: "#0f172a",
        "surface-variant": "#e2e8f0",
        "brand-indigo": "#4338ca",
        "brand-cyan": "#06b6d4",
        "brand-emerald": "#059669",
        "brand-amber": "#D97706",
        "brand-purple": "#7c3aed",
        "po-tertiary-fixed-dim": "#6bd8cb",
        "po-error": "#ba1a1a",
        "po-surface-container-highest": "#dae2fd",
        "po-on-tertiary-fixed-variant": "#005049",
        "po-secondary": "#4e45d5",
        "po-on-tertiary": "#ffffff",
        "po-error-container": "#ffdad6",
        "po-on-secondary-fixed-variant": "#372abf",
        "po-primary": "#091426",
        "po-surface": "#faf8ff",
        "po-outline": "#75777d",
        "po-surface-dim": "#d2d9f4",
        "po-on-secondary-fixed": "#100069",
        "po-on-surface": "#131b2e",
        "po-primary-container": "#1e293b",
        "po-secondary-fixed": "#e3dfff",
        "po-on-surface-variant": "#45474c",
        "po-inverse-surface": "#283044",
        "po-surface-container-low": "#f2f3ff",
        "po-background": "#faf8ff",
        "po-surface-container-lowest": "#ffffff",
        "po-secondary-fixed-dim": "#c3c0ff",
        "po-on-primary-fixed-variant": "#3c475a",
        "po-secondary-container": "#6860ef",
        "po-tertiary": "#001815",
        "po-tertiary-container": "#002f2a",
        "po-primary-fixed-dim": "#bcc7de",
        "po-surface-container": "#eaedff",
        "po-surface-container-high": "#e2e7ff",
        "po-on-tertiary-container": "#28a094",
        "po-outline-variant": "#c5c6cd",
        "po-on-primary": "#ffffff",
        "po-on-tertiary-fixed": "#00201d",
        "po-tertiary-fixed": "#89f5e7",
        "po-on-secondary-container": "#fffbff",
        "po-inverse-primary": "#bcc7de",
        "po-on-primary-container": "#8590a6",
        "po-on-secondary": "#ffffff",
        "po-surface-variant": "#dae2fd",
        "po-on-background": "#131b2e",
        "po-surface-bright": "#faf8ff",
        "po-on-primary-fixed": "#111c2d",
        "po-primary-fixed": "#d8e3fb",
        "po-on-error-container": "#93000a",
        "po-surface-tint": "#545f73",
        "po-on-error": "#ffffff",
        "po-inverse-on-surface": "#eef0ff",
        "brand-blue": "#2563EB",
        "brand-dark": "#0F172A",
        "brand-teal": "#0D9488",
        "brand-green": "#16A34A",
        "brand-red": "#DC2626",
        "cm-primary": "#2563EB",
        "cm-surface": "#F6F8FB",
        card: "#FFFFFF",
        borderCol: "#E5EAF1",
        textMain: "#172033",
        textMuted: "#667085",
        "brand-50": "#eff6ff",
        "brand-100": "#dbeafe",
        "brand-500": "#3b82f6",
        "brand-600": "#2563eb",
        "brand-700": "#1d4ed8",
        "ps-brand-50": "#EEF2FF",
        "ps-brand-100": "#E0E7FF",
        "ps-brand-500": "#6366F1",
        "ps-brand-600": "#4F46E5",
        "ps-brand-700": "#2563EB",
        "surface-page": "#F6F8FB",
        "surface-card": "#FFFFFF",
        "surface-border": "#E5EAF1",
        "surface-subtle": "#F8FAFC",
        primaryText: "#172033",
        mutedText: "#64748B"
      },
      fontFamily: {
        "headline-sm": [
          "Inter"
        ],
        "headline-lg": [
          "Inter"
        ],
        "body-md": [
          "Inter"
        ],
        "label-ui": [
          "Inter"
        ],
        "body-sm": [
          "Inter"
        ],
        "body-lg": [
          "Inter"
        ],
        "label-mono-xs": [
          "JetBrains Mono"
        ],
        "label-mono-sm": [
          "JetBrains Mono"
        ],
        "headline-md": [
          "Inter"
        ],
        "display-kpi": [
          "Inter"
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      },
      fontSize: {
        "headline-sm": [
          "16px",
          {
            lineHeight: "24px",
            fontWeight: "600"
          }
        ],
        "headline-lg": [
          "24px",
          {
            lineHeight: "32px",
            fontWeight: "600"
          }
        ],
        "body-md": [
          "13px",
          {
            lineHeight: "18px",
            fontWeight: "400"
          }
        ],
        "label-ui": [
          "11px",
          {
            lineHeight: "14px",
            fontWeight: "600"
          }
        ],
        "body-sm": [
          "12px",
          {
            lineHeight: "16px",
            fontWeight: "400"
          }
        ],
        "body-lg": [
          "15px",
          {
            lineHeight: "22px",
            fontWeight: "400"
          }
        ],
        "label-mono-xs": [
          "10px",
          {
            lineHeight: "12px",
            fontWeight: "500"
          }
        ],
        "label-mono-sm": [
          "11px",
          {
            lineHeight: "14px",
            fontWeight: "500"
          }
        ],
        "headline-md": [
          "20px",
          {
            lineHeight: "28px",
            fontWeight: "600"
          }
        ],
        "display-kpi": [
          "32px",
          {
            lineHeight: "38px",
            fontWeight: "600"
          }
        ]
      },
      spacing: {
        "space-xl": "1.5rem",
        "space-md": "0.75rem",
        "space-2xl": "2rem",
        margin: "1.5rem",
        "margin-compact": "1rem",
        "gutter-compact": "0.75rem",
        gutter: "1rem",
        "space-xs": "0.25rem",
        "space-lg": "1rem",
        "space-2xs": "0.125rem",
        "space-sm": "0.5rem"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
        po: "0.125rem",
        "po-lg": "0.25rem",
        "po-xl": "0.5rem",
        "po-full": "0.75rem"
      }
    },
  },
  plugins: [forms, containerQueries],
} satisfies Config;

export default config;
