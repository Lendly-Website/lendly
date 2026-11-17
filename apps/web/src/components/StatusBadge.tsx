import { BOOKING_STATUS_LABELS, REQUEST_STATUS_LABELS, VERIFICATION_STATUSES, type BookingStatus, type RequestStatus, type VerificationStatus, type ListingStatus } from "@lendly/shared";

function tone(value: string) {
  if (["accepted", "verified", "available", "completed"].includes(value)) return "success";
  if (["active", "confirmed"].includes(value)) return "petrol";
  if (["pending", "paused", "unverified", "reviewing"].includes(value)) return "warning";
  if (["rejected", "cancelled", "removed", "suspended", "disputed", "failed"].includes(value)) return "danger";
  if (["returned"].includes(value)) return "muted";
  return "neutral";
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge ${tone(status)}`}>{REQUEST_STATUS_LABELS[status]}</span>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge ${tone(status)}`}>{BOOKING_STATUS_LABELS[status]}</span>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (!VERIFICATION_STATUSES.includes(status)) return null;
  return <span className={`badge ${tone(status)}`}>{status === "verified" ? "Verified" : status}</span>;
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`badge ${tone(status)}`}>{status}</span>;
}

export function Badge({ label, toneName = "neutral" }: { label: string; toneName?: string }) {
  return <span className={`badge ${tone(toneName)}`}>{label}</span>;
}
