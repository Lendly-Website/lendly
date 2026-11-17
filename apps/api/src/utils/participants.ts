/**
 * Returns the borrower and lender ids of a booking or borrow request as strings.
 *
 * Documents may arrive either as raw ObjectIds or as populated sub-documents,
 * where `String(doc)` yields the whole document instead of the id.
 */
export function participantIds(document: {
  borrowerId?: unknown;
  lenderId?: unknown;
}): string[] {
  return [idOf(document.borrowerId), idOf(document.lenderId)];
}

export function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}
