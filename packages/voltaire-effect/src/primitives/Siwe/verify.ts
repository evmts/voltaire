/**
 * @module verify
 * @description Effect-wrapped SIWE verification
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Siwe } from "@tevm/voltaire";
import type { SiweMessageType } from "./String.js";
import type { Signature as SiweSignature } from "@tevm/voltaire/Siwe";

/**
 * Verify SIWE message signature
 *
 * @param message - SIWE message to verify
 * @param signature - Signature to verify against (65 bytes: r(32) + s(32) + v(1))
 * @returns Effect yielding boolean
 * @example
 * ```typescript
 * const isValid = await Effect.runPromise(Siwe.verify(message, signature))
 * ```
 */
export const verify = (
  message: SiweMessageType,
  signature: SiweSignature,
): Effect.Effect<boolean, Error> =>
  Effect.try({
    try: () => Siwe.verify(message, signature),
    catch: (e) => e as Error,
  });

/**
 * Verify SIWE message with full validation
 *
 * @param message - SIWE message to verify
 * @param signature - Signature to verify against
 * @param options - Verification options
 * @returns Effect yielding ValidationResult
 */
export const verifyMessage = (
  message: SiweMessageType,
  signature: SiweSignature,
  options?: { now?: Date },
): Effect.Effect<ReturnType<typeof Siwe.verifyMessage>, Error> =>
  Effect.try({
    try: () => Siwe.verifyMessage(message, signature, options),
    catch: (e) => e as Error,
  });
