/**
 * @module from
 * @description Effect-wrapped Base64 constructors
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Base64, type BrandedBase64, type BrandedBase64Url } from "@tevm/voltaire/Base64";
import { ValidationError } from "@tevm/voltaire/errors";

/**
 * Create validated standard Base64 string from input
 *
 * @param value - String or Uint8Array to convert
 * @returns Effect yielding BrandedBase64
 * @example
 * ```typescript
 * const b64 = await Effect.runPromise(Base64.from('SGVsbG8='))
 * ```
 */
export const from = (
  value: string | Uint8Array,
): Effect.Effect<BrandedBase64, ValidationError> =>
  Effect.try({
    try: () => Base64.from(value),
    catch: (error) =>
      new ValidationError(
        error instanceof Error ? error.message : "Invalid Base64 input",
        {
          value,
          expected: "valid Base64 string or Uint8Array",
          cause: error instanceof Error ? error : undefined,
        },
      ),
  });

/**
 * Create validated URL-safe Base64 string from input
 *
 * @param value - String or Uint8Array to convert
 * @returns Effect yielding BrandedBase64Url
 */
export const fromUrlSafe = (
  value: string | Uint8Array,
): Effect.Effect<BrandedBase64Url, ValidationError> =>
  Effect.try({
    try: () => Base64.fromUrlSafe(value),
    catch: (error) =>
      new ValidationError(
        error instanceof Error ? error.message : "Invalid URL-safe Base64 input",
        {
          value,
          expected: "valid URL-safe Base64 string or Uint8Array",
          cause: error instanceof Error ? error : undefined,
        },
      ),
  });
