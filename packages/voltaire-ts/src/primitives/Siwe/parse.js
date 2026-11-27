import * as Address from "../Address/internal-index.js";
import {
	InvalidFieldError,
	InvalidSiweMessageError,
	MissingFieldError,
	SiweParseError,
} from "./errors.js";

const DOMAIN_HEADER_REGEX =
	/^(?:[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/)?(.+) wants you to sign in with your Ethereum account:$/;
const ADDRESS_LINE_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Parse header lines (domain + Ethereum address)
 * @internal
 * @param {string[]} lines
 * @param {string} text
 * @returns {{ domain: string; address: import('../Address/AddressType.js').AddressType }}
 */
function parseHeader(lines, text) {
	const headerLine = lines[0];
	const headerMatch = headerLine?.match(DOMAIN_HEADER_REGEX);
	if (!headerMatch?.[1]) {
		throw new InvalidSiweMessageError("missing domain header", {
			value: text,
		});
	}

	const addressLine = lines[1];
	if (!addressLine || !ADDRESS_LINE_REGEX.test(addressLine)) {
		throw new MissingFieldError("address");
	}

	// Normalize to lowercase because EIP-4361 parsing accepts mixed-case hex
	const address = Address.from(addressLine.toLowerCase());
	return { domain: headerMatch[1], address };
}

/**
 * Locate the URI suffix start index and extract optional multiline statement
 * @internal
 * @param {string[]} lines
 * @param {string} text
 * @returns {{ uriIdx: number; statement: string | undefined }}
 */
function extractStatementAndSuffixStart(lines, text) {
	const required = ["URI:", "Version:", "Chain ID:", "Nonce:", "Issued At:"];
	for (const label of required) {
		if (!text.includes(label)) {
			throw new MissingFieldError(label.slice(0, -1));
		}
	}

	let uriIdx = -1;
	for (let i = 2; i < lines.length; i++) {
		if (lines[i]?.startsWith("URI:") && lines[i + 1]?.startsWith("Version:")) {
			uriIdx = i;
			break;
		}
	}
	if (uriIdx === -1) {
		uriIdx = lines.findIndex((line, i) => i >= 2 && line.startsWith("URI:"));
	}
	if (uriIdx === -1) {
		throw new MissingFieldError("URI");
	}

	let start = 2;
	if (start < uriIdx && lines[start]?.trim() === "") {
		start++;
	}
	let end = uriIdx;
	if (end > start && lines[end - 1]?.trim() === "") {
		end--;
	}

	const statement =
		end > start ? lines.slice(start, end).join("\n") : undefined;
	return { uriIdx, statement };
}

/**
 * Read a required prefixed field line
 * @internal
 * @param {string[]} lines
 * @param {number} idx
 * @param {string} fieldName
 * @returns {string}
 */
function readRequiredField(lines, idx, fieldName) {
	const line = lines[idx];
	const prefix = `${fieldName}:`;
	if (!line?.startsWith(prefix)) {
		throw new MissingFieldError(fieldName);
	}
	const value = line.slice(prefix.length).trim();
	if (value.length === 0) {
		throw new InvalidFieldError(fieldName, "cannot be empty", { value });
	}
	return value;
}

/**
 * Parse optional trailing EIP-4361 fields (Expiration Time, Not Before, Request ID, Resources)
 * @internal
 * @param {string[]} lines
 * @param {number} startIdx
 * @param {string} text
 * @returns {{ expirationTime?: string; notBefore?: string; requestId?: string; resources?: string[] }}
 */
function parseOptionalFields(lines, startIdx, text) {
	let idx = startIdx;
	/** @type {{ expirationTime?: string; notBefore?: string; requestId?: string; resources?: string[] }} */
	const optional = {};

	if (lines[idx]?.startsWith("Expiration Time:")) {
		optional.expirationTime = lines[idx]
			?.slice("Expiration Time:".length)
			.trim();
		idx++;
	}

	if (lines[idx]?.startsWith("Not Before:")) {
		optional.notBefore = lines[idx]?.slice("Not Before:".length).trim();
		idx++;
	}

	if (lines[idx]?.startsWith("Request ID:")) {
		const reqId = lines[idx]?.slice("Request ID:".length).trim();
		if (reqId) {
			optional.requestId = reqId;
		}
		idx++;
	}

	if (lines[idx] === "Resources:") {
		idx++;
		/** @type {string[]} */
		const resources = [];
		while (idx < lines.length && lines[idx]?.startsWith("- ")) {
			resources.push(/** @type {string} */ (lines[idx]).slice(2));
			idx++;
		}
		optional.resources = resources;
	}

	if (idx < lines.length) {
		throw new SiweParseError(`Unexpected line in SIWE message: ${lines[idx]}`, {
			value: text,
		});
	}

	return optional;
}

/**
 * Parse a SIWE message from a formatted string
 *
 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
 * @since 0.0.0
 * @param {string} text - Formatted SIWE message string
 * @returns {import('./SiweMessageType.js').SiweMessageType} Parsed Message object
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
	const lines = text.split("\n");
	const { domain, address } = parseHeader(lines, text);
	const { uriIdx, statement } = extractStatementAndSuffixStart(lines, text);

	const uri = readRequiredField(lines, uriIdx, "URI");
	const version = readRequiredField(lines, uriIdx + 1, "Version");
	const chainIdRaw = readRequiredField(lines, uriIdx + 2, "Chain ID");
	if (!/^\d+$/.test(chainIdRaw)) {
		throw new InvalidFieldError("Chain ID", "must be a number", {
			value: chainIdRaw,
		});
	}
	const chainId = Number(chainIdRaw);
	const nonce = readRequiredField(lines, uriIdx + 3, "Nonce");
	const issuedAt = readRequiredField(lines, uriIdx + 4, "Issued At");
	const optional = parseOptionalFields(lines, uriIdx + 5, text);

	/** @type {import('./SiweMessageType.js').SiweMessageType} */
	const message = {
		domain,
		address,
		uri,
		version,
		chainId,
		nonce,
		issuedAt,
		...(statement !== undefined ? { statement } : {}),
		...optional,
	};

	return message;
}
