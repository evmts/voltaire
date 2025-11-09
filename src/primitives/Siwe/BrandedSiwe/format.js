/**
 * Format a SIWE message into a string for signing (EIP-4361)
 *
 * @param {import('./BrandedMessage.js').BrandedMessage} message - Message to format
 * @returns {string} Formatted string according to EIP-4361 specification
 *
 * @example
 * ```typescript
 * const message = {
 *   domain: "example.com",
 *   address: Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
 *   uri: "https://example.com",
 *   version: "1",
 *   chainId: 1,
 *   nonce: "32891756",
 *   issuedAt: "2021-09-30T16:25:24Z",
 * };
 *
 * const text = format(message);
 * ```
 */
export function format(message) {
	const lines = [];

	// Header: domain + address
	lines.push(
		`${message.domain} wants you to sign in with your Ethereum account:`,
	);

	// Convert address bytes to hex string for display
	const addressHex = `0x${Array.from(message.address)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
	lines.push(addressHex);
	lines.push("");

	// Optional statement
	if (message.statement) {
		lines.push(message.statement);
		lines.push("");
	}

	// Required fields
	lines.push(`URI: ${message.uri}`);
	lines.push(`Version: ${message.version}`);
	lines.push(`Chain ID: ${message.chainId}`);
	lines.push(`Nonce: ${message.nonce}`);
	lines.push(`Issued At: ${message.issuedAt}`);

	// Optional fields
	if (message.expirationTime) {
		lines.push(`Expiration Time: ${message.expirationTime}`);
	}
	if (message.notBefore) {
		lines.push(`Not Before: ${message.notBefore}`);
	}
	if (message.requestId) {
		lines.push(`Request ID: ${message.requestId}`);
	}
	if (message.resources && message.resources.length > 0) {
		lines.push("Resources:");
		for (const resource of message.resources) {
			lines.push(`- ${resource}`);
		}
	}

	return lines.join("\n");
}
