/**
 * Base error class for all Voltaire errors.
 *
 * Provides Effect.ts-compatible error structure with _tag discriminant
 * and viem-style cause chaining for rich error context.
 *
 * @example
 * ```typescript
 * export class InvalidHexError extends VoltaireError {
 *   readonly _tag = "InvalidHex" as const
 *   override name = "InvalidHex" as const
 *
 *   constructor(input: unknown, cause?: Error) {
 *     super(input, `Invalid hex: ${input}`, cause)
 *   }
 * }
 * ```
 */
export declare class VoltaireError extends Error {
    readonly input: unknown;
    readonly _tag: string;
    constructor(input: unknown, message?: string, cause?: Error);
}
//# sourceMappingURL=VoltaireError.d.ts.map