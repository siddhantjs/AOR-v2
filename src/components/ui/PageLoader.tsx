type PageLoaderProps = {
  open: boolean;
  message?: string;
};

/** Full-viewport blocking overlay while a long API call runs. */
export function PageLoader({ open, message = "Please wait…" }: PageLoaderProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[color-mix(in_srgb,var(--navy)_45%,transparent)] p-6 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label={message}
    >
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-[14px] bg-[var(--bg-elevated)] px-8 py-7 text-center shadow-[var(--shadow-lg)]">
        <div
          className="size-10 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--red)]"
          aria-hidden
        />
        <p className="font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--navy)]">
          {message}
        </p>
      </div>
    </div>
  );
}
