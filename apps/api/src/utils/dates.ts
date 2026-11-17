export function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function daysInclusive(startDate: Date, endDate: Date): number {
  const milliseconds = endOfDay(endDate).getTime() - startOfDay(startDate).getTime();
  return Math.max(1, Math.floor(milliseconds / 86_400_000) + 1);
}

export function rangesOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart <= secondEnd && firstEnd >= secondStart;
}
