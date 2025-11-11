import * as OxSiwe from "ox/Siwe";
import * as Address from "../../Address/BrandedAddress/index.js";
import {
	InvalidSiweMessageError,
	MissingFieldError,
	InvalidFieldError,
	SiweParseError,
} from "./errors.js";

/**
 * Parse a SIWE message from a formatted string
 *
 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
 * @since 0.0.0
 * @param {string} text - Formatted SIWE message string
 * @returns {import('./BrandedMessage.js').BrandedMessage} Parsed Message object
 * @throws {InvalidSiweMessageError} if message format is invalid
 * @throws {MissingFieldError} if required field is missing
 * @throws {InvalidFieldError} if field value is invalid
 * @throws {SiweParseError} if parsing fails
 * @example
 * ```javascript
 * import * as Siwe from './primitives/Siwe/index.js';
 * const text = `example.com wants you to sign in with your Ethereum account:
 * 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
 *
 * Sign in to Example
 *
 * URI: https://example.com
 * Version: 1
 * Chain ID: 1
 * Nonce: 32891756
 * Issued At: 2021-09-30T16:25:24Z`;
 *
 * const message = Siwe.parse(text);
 * ```
 */
export function parse(text) {
	try {
		// Validate domain header format before ox parsing
		const lines = text.split("\n");
		if (
			!lines[0] ||
			!lines[0].match(/^.+ wants you to sign in with your Ethereum account:$/)
		) {
			throw new InvalidSiweMessageError("missing domain header", {
				value: text,
			});
		}

		// Normalize address to lowercase to avoid checksum validation issues
		// ox validates checksums strictly, but SIWE spec allows mixed case
		const normalizedText = text.replace(/0x[0-9a-fA-F]{40}/, (match) =>
			match.toLowerCase(),
		);

		// Extract multiline statement manually (ox doesn't support this)
		let statement;
		const statementLines = [];
		let lineIdx = 2; // Start after domain and address lines

		// Skip empty line after address
		if (lines[lineIdx]?.trim() === "") {
			lineIdx++;
		}

		// Collect statement lines until empty line or field with colon
		while (
			lineIdx < lines.length &&
			lines[lineIdx]?.trim() !== "" &&
			!lines[lineIdx]?.includes(":")
		) {
			statementLines.push(lines[lineIdx]);
			lineIdx++;
		}
		if (statementLines.length > 0) {
			statement = statementLines.join("\n");
		}

		// Use ox to parse the message
		const oxMessage = OxSiwe.parseMessage(normalizedText);

		// Validate address field is present
		if (!oxMessage.address) {
			throw new MissingFieldError("address");
		}

		// Convert address from hex to BrandedAddress
		const address = Address.from(oxMessage.address);

		// Extract original timestamp strings from text to preserve format
		const issuedAtMatch = text.match(/Issued At:\s*(.+)/);
		const expirationTimeMatch = text.match(/Expiration Time:\s*(.+)/);
		const notBeforeMatch = text.match(/Not Before:\s*(.+)/);

		// Validate required fields are actually present in the text
		if (!text.includes("URI:")) {
			throw new MissingFieldError("URI");
		}
		if (!text.includes("Version:")) {
			throw new MissingFieldError("Version");
		}
		if (!text.includes("Chain ID:")) {
			throw new MissingFieldError("Chain ID");
		}
		if (!text.includes("Nonce:")) {
			throw new MissingFieldError("Nonce");
		}
		if (!text.includes("Issued At:")) {
			throw new MissingFieldError("Issued At");
		}

		// Validate chain ID is a number
		const chainIdMatch = text.match(/Chain ID:\s*(.+)/);
		if (chainIdMatch?.[1]) {
			const chainIdValue = chainIdMatch[1].trim();
			if (!/^\d+$/.test(chainIdValue)) {
				throw new InvalidFieldError("Chain ID", "must be a number", {
					value: chainIdValue,
				});
			}
		}

		// Convert Date objects to ISO strings, preserving original format when possible
		/** @type {import('./BrandedMessage.js').BrandedMessage} */
		const message = {
			domain: oxMessage.domain || "",
			address,
			uri: oxMessage.uri || "",
			version: oxMessage.version || "1",
			chainId: oxMessage.chainId || 1,
			nonce: oxMessage.nonce || "",
			issuedAt: issuedAtMatch?.[1] || oxMessage.issuedAt?.toISOString() || "",
			// Use manually extracted multiline statement if available, otherwise use ox's
			...(statement
				? { statement }
				: oxMessage.statement
					? { statement: oxMessage.statement }
					: {}),
			...(oxMessage.expirationTime
				? {
						expirationTime:
							expirationTimeMatch?.[1] ||
							oxMessage.expirationTime.toISOString(),
					}
				: {}),
			...(oxMessage.notBefore
				? {
						notBefore: notBeforeMatch?.[1] || oxMessage.notBefore.toISOString(),
					}
				: {}),
			...(oxMessage.requestId ? { requestId: oxMessage.requestId } : {}),
			...(oxMessage.resources ? { resources: oxMessage.resources } : {}),
		};

		return message;
	} catch (error) {
		// Re-throw our own errors directly
		if (
			error instanceof InvalidSiweMessageError ||
			error instanceof MissingFieldError ||
			error instanceof InvalidFieldError
		) {
			throw error;
		}

		// Map error messages to expected Voltaire format
		const errMsg = error instanceof Error ? error.message : String(error);

		// Map ox error messages to Voltaire-expected messages
		if (errMsg.includes("Unsupported address value type")) {
			throw new MissingFieldError("address", { cause: error });
		}
		if (errMsg.includes("Invalid message field") && errMsg.includes("domain")) {
			throw new InvalidSiweMessageError("missing domain header", {
				value: text,
				cause: error,
			});
		}

		// Generic parse error with cause chain
		throw new SiweParseError(errMsg, {
			value: text,
			cause: error,
		});
	}
}
