import { format, differenceInCalendarDays } from "date-fns";

export function formatDate(value: string | Date): string {
  return format(new Date(value), "d MMM yyyy");
}

export function formatDateTime(value: string | Date): string {
  return format(new Date(value), "d MMM yyyy, h:mm a");
}

export function formatRange(startDate: string | Date, endDate: string | Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  if (differenceInCalendarDays(end, start) === 0) return formatDate(start);
  return `${format(start, sameYear ? "d MMM" : "d MMM yyyy")} – ${formatDate(end)}`;
}

export function formatDistance(meters?: number): string {
  if (meters === undefined) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function rupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function toIsoDateInput(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}
