/**
 * @module decode
 * @description Effect-wrapped Base64 decode operations
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Base64 } from "@tevm/voltaire/Base64";

/**
 * Decode standard Base64 string to bytes
 *
 * @param encoded - Base64 encoded string
 * @returns Effect yielding decoded Uint8Array
 * @example
 * ```typescript
 * const bytes = await Effect.runPromise(Base64.decode('SGVsbG8='))
 * ```
 */
export const decode = (encoded: string): Effect.Effect<Uint8Array, Error> =>
  Effect.try({
    try: () => Base64.decode(encoded),
    catch: (e) => e as Error,
  });

/**
 * Decode standard Base64 string to UTF-8 string
 *
 * @param encoded - Base64 encoded string
 * @returns Effect yielding decoded string
 */
export const decodeToString = (encoded: string): Effect.Effect<string, Error> =>
  Effect.try({
    try: () => Base64.decodeToString(encoded),
    catch: (e) => e as Error,
  });

/**
 * Decode URL-safe Base64 string to bytes
 *
 * @param encoded - URL-safe Base64 encoded string
 * @returns Effect yielding decoded Uint8Array
 */
export const decodeUrlSafe = (encoded: string): Effect.Effect<Uint8Array, Error> =>
  Effect.try({
    try: () => Base64.decodeUrlSafe(encoded),
    catch: (e) => e as Error,
  });

/**
 * Decode URL-safe Base64 string to UTF-8 string
 *
 * @param encoded - URL-safe Base64 encoded string
 * @returns Effect yielding decoded string
 */
export const decodeUrlSafeToString = (encoded: string): Effect.Effect<string, Error> =>
  Effect.try({
    try: () => Base64.decodeUrlSafeToString(encoded),
    catch: (e) => e as Error,
  });
