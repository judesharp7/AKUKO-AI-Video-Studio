"use client";

import { AlertTriangle, Loader2, Sparkles } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#26262F] bg-[#15151C]/60 p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C5CFF]/15 text-[#7C5CFF]">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-[#A1A1AA]">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl studio-gradient px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingActivity({ activity }: { activity: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-3 text-sm text-white"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
      <span>{activity}</span>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Try Again",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-sm text-white"
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-[#EF4444]" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-[#EF4444]/40 bg-[#15151C] px-3 py-1 text-xs font-medium text-white hover:bg-[#EF4444]/20 transition"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

