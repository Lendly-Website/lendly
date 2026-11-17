/**
 * Mongoose `toJSON` transform for documents whose refs may be populated.
 *
 * The API contract exposes `itemId`, `borrowerId` and `lenderId` as ids plus
 * optional `item`, `borrower` and `lender` objects (see packages/shared).
 * Populated refs are therefore copied to their alias and replaced with the id.
 */
export function splitReferences(
  result: Record<string, unknown>,
  aliases: Record<string, string>,
): void {
  for (const [field, alias] of Object.entries(aliases)) {
    const value = result[field];
    if (!value || typeof value !== "object") continue;
    const populated = value as Record<string, unknown>;
    result[alias] = populated;
    result[field] = String(populated.id ?? populated._id);
  }
}
