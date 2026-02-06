/**
 * Get event signature string (e.g., "Transfer(address,address,uint256)")
 *
 * @param {import('./EventType.js').EventType} event - Event definition
 * @returns {string} Event signature
 *
 * @example
 * ```typescript
 * const event = { type: "event", name: "Transfer", inputs: [...] };
 * const sig = Event.getSignature(event); // "Transfer(address,address,uint256)"
 * ```
 */
export function getSignature(event: import("./EventType.js").EventType): string;
//# sourceMappingURL=getSignature.d.ts.map