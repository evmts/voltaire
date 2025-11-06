/**
 * Get event signature string (e.g., "Transfer(address,address,uint256)")
 *
 * @param {import('./BrandedEvent.js').Event} event - Event definition
 * @returns {string} Event signature
 *
 * @example
 * ```typescript
 * const event = { type: "event", name: "Transfer", inputs: [...] };
 * const sig = Event.getSignature(event); // "Transfer(address,address,uint256)"
 * ```
 */
export function getSignature(event) {
	const inputs = event.inputs.map((p) => p.type).join(",");
	return `${event.name}(${inputs})`;
}
