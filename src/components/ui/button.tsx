import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  children: ReactNode;
};

const VARIANTS = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover disabled:hover:bg-accent",
  secondary:
    "border border-border bg-surface text-foreground hover:border-accent",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
  danger: "bg-danger text-paper-50 hover:opacity-90",
};

/** Primary control with a visible loading state that keeps the original label. */
export function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-sm font-medium transition-colors duration-200 disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
