import { randomBytes } from "crypto";

/** Collision-resistant, URL-friendly id (used as table PK). */
export function newId(prefix?: string): string {
  const id = randomBytes(12).toString("hex");
  return prefix ? `${prefix}_${id}` : id;
}

/** Public-facing reference numbers, e.g. BKG-7F3K9Q. */
export function bookingRef(): string {
  return `MH-${randomBytes(4).toString("hex").toUpperCase()}`;
}
