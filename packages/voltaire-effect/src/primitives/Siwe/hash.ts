/**
 * @module hash
 * @description Effect-wrapped SIWE hash operations
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Siwe } from "@tevm/voltaire";
import type { SiweMessageType } from "./String.js";

/**
 * Get message hash for signing
 *
 * @param message - SIWE message to hash
 * @returns Effect yielding 32-byte hash
 * @example
 * ```typescript
 * const hash = await Effect.runPromise(Siwe.getMessageHash(message))
 * ```
 */
export const getMessageHash = (message: SiweMessageType): Effect.Effect<Uint8Array, Error> =>
  Effect.try({
    try: () => Siwe.getMessageHash(message),
    catch: (e) => e as Error,
  });

// Re-export factory for advanced usage
export { GetMessageHash, Verify, VerifyMessage } from "@tevm/voltaire/Siwe";
