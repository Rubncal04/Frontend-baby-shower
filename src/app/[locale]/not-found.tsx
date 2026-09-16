import { Link } from "@/i18n/navigation";

/** Recovery path when a locale or route does not exist. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-3xl">404</p>
      <Link
        href="/"
        className="min-h-11 text-sm text-accent underline-offset-4 hover:underline"
      >
        Nohan
      </Link>
    </div>
  );
}
