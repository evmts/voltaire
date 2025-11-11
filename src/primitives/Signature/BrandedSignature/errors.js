import {
	InvalidFormatError,
	InvalidLengthError,
	InvalidSignatureError,
} from "../../errors/index.js";

/**
 * Error for invalid signature length
 *
 * @example
 * ```typescript
 * throw new InvalidSignatureLengthError(
 *   'Compact signature must be 64 bytes',
 *   {
 *     value: sig.length,
 *     expected: '64 bytes',
 *     code: 'SIGNATURE_INVALID_LENGTH',
 *     docsPath: '/primitives/signature/from-compact#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidSignatureLengthError extends InvalidLengthError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "SIGNATURE_INVALID_LENGTH",
			value: options?.value,
			expected: options?.expected || "valid signature length",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/signature#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidSignatureLengthError";
	}
}

/**
 * Error for invalid signature format
 *
 * @example
 * ```typescript
 * throw new InvalidSignatureFormatError(
 *   'Unsupported signature value type',
 *   {
 *     value: typeof input,
 *     expected: 'Uint8Array or signature object',
 *     code: 'SIGNATURE_INVALID_FORMAT',
 *     docsPath: '/primitives/signature/from#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidSignatureFormatError extends InvalidFormatError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "SIGNATURE_INVALID_FORMAT",
			value: options?.value,
			expected: options?.expected || "valid signature format",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/signature#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidSignatureFormatError";
	}
}

/**
 * Error for invalid signature algorithm
 *
 * @example
 * ```typescript
 * throw new InvalidAlgorithmError(
 *   'DER encoding only supported for ECDSA signatures',
 *   {
 *     value: algorithm,
 *     expected: 'secp256k1 or p256',
 *     code: 'SIGNATURE_INVALID_ALGORITHM',
 *     docsPath: '/primitives/signature/to-der#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidAlgorithmError extends InvalidSignatureError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "SIGNATURE_INVALID_ALGORITHM",
			context: {
				...options?.context,
				value: options?.value,
				expected: options?.expected,
			},
			docsPath: options?.docsPath || "/primitives/signature#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidAlgorithmError";
	}
}

/**
 * Error for non-canonical signature
 *
 * @example
 * ```typescript
 * throw new NonCanonicalSignatureError(
 *   's value is not in canonical form',
 *   {
 *     value: s,
 *     expected: 's < n/2',
 *     code: 'SIGNATURE_NON_CANONICAL',
 *     docsPath: '/primitives/signature/canonical#error-handling'
 *   }
 * )
 * ```
 */
export class NonCanonicalSignatureError extends InvalidSignatureError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "SIGNATURE_NON_CANONICAL",
			context: {
				...options?.context,
				value: options?.value,
				expected: options?.expected,
			},
			docsPath: options?.docsPath || "/primitives/signature#error-handling",
			cause: options?.cause,
		});
		this.name = "NonCanonicalSignatureError";
	}
}

/**
 * Error for invalid DER encoding
 *
 * @example
 * ```typescript
 * throw new InvalidDERError(
 *   'Expected SEQUENCE tag (0x30)',
 *   {
 *     value: tag,
 *     expected: '0x30',
 *     code: 'SIGNATURE_INVALID_DER',
 *     docsPath: '/primitives/signature/from-der#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidDERError extends InvalidFormatError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "SIGNATURE_INVALID_DER",
			value: options?.value,
			expected: options?.expected || "valid DER encoding",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/signature/from-der#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidDERError";
	}
}
