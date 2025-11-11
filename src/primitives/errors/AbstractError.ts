/**
 * Abstract base error for all Voltaire errors
 *
 * Provides standardized error handling with:
 * - Error cause chain for debugging
 * - Error codes for programmatic handling
 * - Context object for additional metadata
 * - Documentation links for user guidance
 *
 * @example
 * ```typescript
 * class InvalidAddressError extends AbstractError {
 *   constructor(address: string, options?: ErrorOptions) {
 *     super(
 *       `Invalid address format: ${address}`,
 *       {
 *         ...options,
 *         code: options?.code || 'INVALID_ADDRESS',
 *         docsPath: '/primitives/address/from-hex#error-handling'
 *       }
 *     )
 *     this.name = 'InvalidAddressError'
 *   }
 * }
 *
 * // Usage with cause chain
 * try {
 *   parseHex(input)
 * } catch (e) {
 *   throw new InvalidAddressError(input, { cause: e })
 * }
 * ```
 */
export abstract class AbstractError extends Error {
	/**
	 * Machine-readable error code for programmatic handling
	 * @example 'INVALID_FORMAT', 'INVALID_LENGTH'
	 */
	code: string;

	/**
	 * Additional context metadata for debugging
	 * @example { value: '0x123', expected: '20 bytes' }
	 */
	context?: Record<string, unknown>;

	/**
	 * Path to documentation for this error
	 * @example '/primitives/address/from-hex#error-handling'
	 */
	docsPath?: string;

	/**
	 * Root cause of this error (for error chaining)
	 */
	override cause?: Error;

	constructor(
		message: string,
		options?: {
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		// Build enhanced message with cause chain
		let enhancedMessage = message;

		if (options?.cause) {
			enhancedMessage += `\n\nCaused by: ${options.cause.message}`;
		}

		if (options?.docsPath) {
			enhancedMessage += `\n\nDocs: https://voltaire.dev${options.docsPath}`;
		}

		super(enhancedMessage, { cause: options?.cause });

		this.code = options?.code || "UNKNOWN_ERROR";
		this.context = options?.context;
		this.docsPath = options?.docsPath;
		this.cause = options?.cause;

		// Maintains proper stack trace for where error was thrown
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Get full error chain as string for logging
	 */
	getErrorChain(): string {
		const errors: string[] = [this.message];
		let currentError: Error | undefined = this.cause;

		while (currentError) {
			errors.push(currentError.message);
			currentError =
				currentError instanceof AbstractError ? currentError.cause : undefined;
		}

		return errors.join("\n  → ");
	}

	/**
	 * Serialize error to JSON for logging/telemetry
	 */
	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			context: this.context,
			docsPath: this.docsPath,
			stack: this.stack,
			cause:
				this.cause instanceof AbstractError
					? this.cause.toJSON()
					: this.cause?.message,
		};
	}
}
