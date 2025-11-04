/**
 * Validate a SIWE message structure and timestamps
 *
 * @param {import('./BrandedMessage.js').BrandedMessage} message - Message to validate
 * @param {Object} [options] - Validation options
 * @param {Date} [options.now] - Current time for timestamp checks (defaults to now)
 * @returns {import('./BrandedMessage.js').ValidationResult} Validation result with error details if invalid
 *
 * @example
 * ```typescript
 * const result = validate(message);
 * if (!result.valid) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function validate(message, options) {
	// Domain validation
	if (!message.domain || message.domain.length === 0) {
		return {
			valid: false,
			error: { type: "invalid_domain", message: "Domain is required" },
		};
	}

	// Address validation (check it's a proper Uint8Array with 20 bytes)
	if (
		!message.address ||
		!(message.address instanceof Uint8Array) ||
		message.address.length !== 20
	) {
		return {
			valid: false,
			error: {
				type: "invalid_address",
				message: "Invalid Ethereum address format",
			},
		};
	}

	// URI validation
	if (!message.uri) {
		return {
			valid: false,
			error: { type: "invalid_uri", message: "URI is required" },
		};
	}

	// Version validation
	if (message.version !== "1") {
		return {
			valid: false,
			error: {
				type: "invalid_version",
				message: `Invalid version: expected "1", got "${message.version}"`,
			},
		};
	}

	// Chain ID validation
	if (!Number.isInteger(message.chainId) || message.chainId < 1) {
		return {
			valid: false,
			error: {
				type: "invalid_chain_id",
				message: "Chain ID must be a positive integer",
			},
		};
	}

	// Nonce validation
	if (!message.nonce || message.nonce.length < 8) {
		return {
			valid: false,
			error: {
				type: "invalid_nonce",
				message: "Nonce must be at least 8 characters",
			},
		};
	}

	// Timestamp validation
	const now = options?.now || new Date();

	try {
		const issuedAt = new Date(message.issuedAt);
		if (isNaN(issuedAt.getTime())) {
			return {
				valid: false,
				error: {
					type: "invalid_timestamp",
					message: "Invalid issuedAt timestamp",
				},
			};
		}

		if (message.expirationTime) {
			const expirationTime = new Date(message.expirationTime);
			if (isNaN(expirationTime.getTime())) {
				return {
					valid: false,
					error: {
						type: "invalid_timestamp",
						message: "Invalid expirationTime timestamp",
					},
				};
			}
			if (now >= expirationTime) {
				return {
					valid: false,
					error: { type: "expired", message: "Message has expired" },
				};
			}
		}

		if (message.notBefore) {
			const notBefore = new Date(message.notBefore);
			if (isNaN(notBefore.getTime())) {
				return {
					valid: false,
					error: {
						type: "invalid_timestamp",
						message: "Invalid notBefore timestamp",
					},
				};
			}
			if (now < notBefore) {
				return {
					valid: false,
					error: {
						type: "not_yet_valid",
						message: "Message is not yet valid",
					},
				};
			}
		}
	} catch (e) {
		return {
			valid: false,
			error: {
				type: "invalid_timestamp",
				message: `Timestamp parsing error: ${e instanceof Error ? e.message : String(e)}`,
			},
		};
	}

	return { valid: true };
}
