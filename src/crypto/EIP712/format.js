/**
 * Format typed data for human-readable display.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data to format
 * @returns {string} Human-readable multi-line string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const formatted = EIP712.format(typedData);
 * console.log(formatted);
 * ```
 */
export function format(typedData) {
	/** @type {string[]} */
	const lines = [];

	lines.push("EIP-712 Typed Data:");
	lines.push("");

	// Domain
	lines.push("Domain:");
	if (typedData.domain.name) lines.push(`  name: ${typedData.domain.name}`);
	if (typedData.domain.version)
		lines.push(`  version: ${typedData.domain.version}`);
	if (typedData.domain.chainId !== undefined)
		lines.push(`  chainId: ${typedData.domain.chainId}`);
	if (typedData.domain.verifyingContract)
		lines.push(
			`  verifyingContract: 0x${Array.from(typedData.domain.verifyingContract)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`,
		);
	lines.push("");

	// Primary type
	lines.push(`Primary Type: ${typedData.primaryType}`);
	lines.push("");

	// Types
	lines.push("Types:");
	for (const [typeName, props] of Object.entries(typedData.types)) {
		const fields = props.map((p) => `${p.type} ${p.name}`).join(", ");
		lines.push(`  ${typeName}(${fields})`);
	}
	lines.push("");

	// Message
	lines.push("Message:");
	lines.push(JSON.stringify(typedData.message, null, 2));

	return lines.join("\n");
}
