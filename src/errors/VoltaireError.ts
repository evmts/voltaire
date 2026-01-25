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
export class VoltaireError extends Error {
	readonly _tag: string;

	constructor(
		public readonly input: unknown,
		message?: string,
		cause?: Error,
	) {
		const finalMessage = message ?? cause?.message ?? `Error: ${input}`;
		super(finalMessage, cause ? { cause } : undefined);
		this._tag = this.constructor.name;
		this.name = this.constructor.name;
	}
}
