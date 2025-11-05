/**
 * Parse a SIWE message from a formatted string
 *
 * @param {string} text - Formatted SIWE message string
 * @returns {import('./BrandedMessage.js').BrandedMessage} Parsed Message object
 * @throws {Error} If message format is invalid
 *
 * @example
 * ```typescript
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
 * const message = parse(text);
 * ```
 */
export function parse(text) {
	const lines = text.split("\n");
	let lineIndex = 0;

	// Parse header
	const headerMatch = lines[lineIndex]?.match(
		/^(.+) wants you to sign in with your Ethereum account:$/,
	);
	if (!headerMatch || !headerMatch[1]) {
		throw new Error("Invalid SIWE message: missing domain header");
	}
	const domain = headerMatch[1];
	lineIndex++;

	// Parse address (hex string)
	const addressHex = lines[lineIndex]?.trim();
	if (!addressHex || !/^0x[0-9a-fA-F]{40}$/i.test(addressHex)) {
		throw new Error("Invalid SIWE message: missing or invalid address");
	}

	// Convert hex string to Uint8Array (Address type)
	const addressBytes = new Uint8Array(20);
	for (let i = 0; i < 20; i++) {
		addressBytes[i] = Number.parseInt(
			addressHex.slice(2 + i * 2, 4 + i * 2),
			16,
		);
	}
	const address = /** @type {import('../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} */ (addressBytes);
	lineIndex++;

	// Skip empty line
	if (lines[lineIndex]?.trim() === "") {
		lineIndex++;
	}

	// Parse optional statement (lines until next empty line or field)
	let statement;
	const statementLines = [];
	while (
		lineIndex < lines.length &&
		lines[lineIndex]?.trim() !== "" &&
		!lines[lineIndex]?.includes(":")
	) {
		const line = lines[lineIndex];
		if (line) {
			statementLines.push(line);
		}
		lineIndex++;
	}
	if (statementLines.length > 0) {
		statement = statementLines.join("\n");
	}

	// Skip empty line before fields
	if (lines[lineIndex]?.trim() === "") {
		lineIndex++;
	}

	// Parse required and optional fields
	/** @type {Record<string, string>} */
	const fields = {};
	/** @type {string[]} */
	const resources = [];
	let inResources = false;

	while (lineIndex < lines.length) {
		const line = lines[lineIndex];

		if (line === "Resources:") {
			inResources = true;
			lineIndex++;
			continue;
		}

		if (inResources) {
			const resourceMatch = line?.match(/^-\s*(.+)$/);
			if (resourceMatch) {
				const resource = resourceMatch[1];
				if (resource) {
					resources.push(resource);
				}
			}
			lineIndex++;
			continue;
		}

		const fieldMatch = line?.match(/^([^:]+):\s*(.+)$/);
		if (fieldMatch) {
			const key = fieldMatch[1];
			const value = fieldMatch[2];
			if (key && value) {
				fields[key] = value;
			}
		}
		lineIndex++;
	}

	// Extract and validate required fields
	const uri = fields["URI"];
	const version = fields["Version"];
	const chainIdStr = fields["Chain ID"];
	const nonce = fields["Nonce"];
	const issuedAt = fields["Issued At"];

	if (!uri || !version || !chainIdStr || !nonce || !issuedAt) {
		throw new Error(
			"Invalid SIWE message: missing required fields (URI, Version, Chain ID, Nonce, Issued At)",
		);
	}

	// After the check above, we know these are non-null strings
	const validatedUri = uri;
	const validatedVersion = version;
	const validatedNonce = nonce;
	const validatedIssuedAt = issuedAt;

	const chainId = Number.parseInt(chainIdStr, 10);
	if (isNaN(chainId)) {
		throw new Error("Invalid SIWE message: Chain ID must be a number");
	}

	// Build message with proper optional property handling
	/** @type {import('./BrandedMessage.js').BrandedMessage} */
	const message = {
		domain,
		address,
		uri: validatedUri,
		version: validatedVersion,
		chainId,
		nonce: validatedNonce,
		issuedAt: validatedIssuedAt,
		...(statement ? { statement } : {}),
		...(fields["Expiration Time"]
			? { expirationTime: fields["Expiration Time"] }
			: {}),
		...(fields["Not Before"] ? { notBefore: fields["Not Before"] } : {}),
		...(fields["Request ID"] ? { requestId: fields["Request ID"] } : {}),
		...(resources.length > 0 ? { resources } : {}),
	};

	return message;
}
