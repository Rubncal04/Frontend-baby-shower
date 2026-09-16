/** Formats the event date and time for the active locale in Colombia. */
export function formatEventWhen(
  date: string,
  time: string,
  locale: string,
): string {
  const iso = `${date}T${time}:00-05:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return `${date} · ${time}`;

  const datePart = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  }).format(parsed);

  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
  }).format(parsed);

  return `${datePart} · ${timePart}`;
}

/** Waits long enough for a loading indicator to remain visible. */
export function withMinimumDelay<T>(
  promise: Promise<T>,
  ms = 400,
): Promise<T> {
  return Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]).then(([value]) => value);
}
