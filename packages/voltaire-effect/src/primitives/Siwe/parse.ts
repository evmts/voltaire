/**
 * @module parse
 * @description Effect-wrapped SIWE parsing
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Siwe } from "@tevm/voltaire";
import type { SiweMessageType } from "./String.js";

/**
 * Parse SIWE message from formatted string
 *
 * @param text - Formatted SIWE message string
 * @returns Effect yielding SiweMessageType
 * @example
 * ```typescript
 * const message = await Effect.runPromise(Siwe.parse(`example.com wants you to sign in...`))
 * ```
 */
export const parse = (text: string): Effect.Effect<SiweMessageType, Error> =>
  Effect.try({
    try: () => Siwe.parse(text),
    catch: (e) => e as Error,
  });
