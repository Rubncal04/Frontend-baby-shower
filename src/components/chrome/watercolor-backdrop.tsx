/** Decorative watercolor washes that echo the printed invitation. */
export function WatercolorBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <svg
        className="wash-blob absolute -left-24 -top-24 h-[28rem] w-[28rem] opacity-70 dark:opacity-40"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="180" cy="160" r="140" fill="#5B9BD5" opacity="0.22" />
        <circle cx="250" cy="90" r="70" fill="#92BDE7" opacity="0.28" />
        <circle cx="90" cy="80" r="36" fill="#C9A44A" opacity="0.22" />
      </svg>
      <svg
        className="wash-blob absolute -right-16 top-32 h-[22rem] w-[22rem] opacity-60 dark:opacity-35"
        viewBox="0 0 400 400"
        fill="none"
        style={{ animationDelay: "-6s" }}
      >
        <circle cx="220" cy="180" r="130" fill="#1E4A7A" opacity="0.12" />
        <circle cx="300" cy="90" r="50" fill="#6B8F71" opacity="0.2" />
      </svg>
      <svg
        className="absolute bottom-0 left-0 h-56 w-56 opacity-80 dark:opacity-50"
        viewBox="0 0 220 220"
        fill="none"
      >
        <path
          d="M20 200c30-70 48-90 70-120 8 22 6 40-2 62 28-40 52-52 78-58-18 34-14 62-4 88"
          stroke="#6B8F71"
          strokeWidth="2"
          opacity="0.55"
        />
        <path
          d="M48 196c18-36 22-58 18-86"
          stroke="#465F4E"
          strokeWidth="1.5"
          opacity="0.45"
        />
        <circle cx="86" cy="92" r="7" fill="#C9A44A" opacity="0.55" />
      </svg>
      <svg
        className="absolute bottom-8 right-0 h-52 w-52 opacity-80 dark:opacity-50"
        viewBox="0 0 220 220"
        fill="none"
      >
        <path
          d="M200 180c-40-50-70-70-110-88 20 18 28 40 24 66-32-24-58-28-86-22 26 20 40 44 46 74"
          stroke="#6B8F71"
          strokeWidth="2"
          opacity="0.5"
        />
        <circle cx="78" cy="86" r="6" fill="#D7BC72" opacity="0.5" />
      </svg>
    </div>
  );
}
