"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { TONE, type Tone } from "@/lib/labels";

export function Badge({
  tone = "slate",
  dot = false,
  title,
  className = "",
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${TONE[tone].badge} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${TONE[tone].dot}`} />}
      {children}
    </span>
  );
}

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export function EmptyState({ icon = "inbox", title, detail }: { icon?: string; title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 gap-1.5">
      <Icon name={icon} className="text-[28px] text-slate-300" />
      <p className="text-[13px] font-semibold text-slate-600">{title}</p>
      {detail && <p className="text-[12px] text-slate-400 max-w-sm">{detail}</p>}
    </div>
  );
}

export function ErrorNote({ error, className = "" }: { error: string | null; className?: string }) {
  if (!error) return null;
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[12.5px] ${className}`}>
      <Icon name="cloud_off" className="text-[18px] shrink-0" />
      <span>{error}</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

/** Right-hand panel with a backdrop. Escape or a backdrop click closes it. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  footer,
  width = "max-w-[480px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  children: React.ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" onClick={onClose} />
      <aside className={`relative h-full w-full ${width} bg-white border-l border-slate-200 shadow-2xl flex flex-col`}>
        <header className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-bold text-slate-900 truncate">{title}</h2>
              {badge}
            </div>
            {subtitle && <div className="text-[12px] text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">{footer}</footer>}
      </aside>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  width = "max-w-lg",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  children: React.ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative w-full ${width} max-h-[90vh] bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col`}>
        <header className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-xl">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-[13px] text-slate-600 leading-relaxed">{message}</div>
    </Modal>
  );
}

const BUTTON = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-sm",
  secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
  danger: "bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
};

export function Button({
  variant = "secondary",
  icon,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON; icon?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border text-[12.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON[variant]} ${className}`}
    >
      {icon && <Icon name={icon} className="text-[16px]" />}
      {children}
    </button>
  );
}

/** Three-dot menu for table rows. Items with `disabled` explain why in `hint`. */
export function RowMenu({
  items,
}: {
  items: { label: string; icon?: string; onClick: () => void; disabled?: boolean; hint?: string; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);
  useEscape(open, () => setOpen(false));
  return (
    <div className="relative inline-block" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title="Actions"
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
      >
        <Icon name="more_vert" className="text-[18px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-56 py-1 bg-white rounded-lg border border-slate-200 shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              title={item.disabled ? item.hint : undefined}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12.5px] disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.icon && <Icon name={item.icon} className="text-[16px]" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- toasts ------------------------------------------------------------------

type Toast = { id: number; tone: "success" | "error" | "info"; title: string; detail?: string };
type ToastFn = (t: Omit<Toast, "id">) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

const TOAST_LOOK = {
  success: { icon: "check_circle", cls: "border-emerald-200 text-emerald-700" },
  error: { icon: "error", cls: "border-rose-200 text-rose-700" },
  info: { icon: "info", cls: "border-indigo-200 text-indigo-700" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback<ToastFn>((t) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), t.tone === "error" ? 7000 : 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-16 right-4 z-[80] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start gap-2.5 p-3 rounded-lg bg-white border shadow-lg ${TOAST_LOOK[t.tone].cls}`}>
            <Icon name={TOAST_LOOK[t.tone].icon} className="text-[18px] shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800">{t.title}</p>
              {t.detail && <p className="text-[12px] text-slate-500 mt-0.5">{t.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Run an API action with a toast either way. Returns true when it worked. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (fn: () => Promise<unknown>, success: string, detail?: string) => {
      setBusy(true);
      try {
        await fn();
        toast({ tone: "success", title: success, detail });
        return true;
      } catch (e) {
        toast({ tone: "error", title: "That didn't work", detail: e instanceof Error ? e.message : String(e) });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { run, busy };
}
