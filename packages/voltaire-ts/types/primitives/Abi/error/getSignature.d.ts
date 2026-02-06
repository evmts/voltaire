/**
 * Get the signature string for an error (e.g., "MyError(uint256,address)")
 *
 * @template {string} TName
 * @template {readonly import('../parameter/index.js').BrandedParameter[]} TInputs
 * @param {import('./ErrorType.js').ErrorType<TName, TInputs>} error - ABI error definition
 * @returns {string} Error signature string
 *
 * @example
 * ```typescript
 * const error = { type: "error", name: "Unauthorized", inputs: [{ type: "address", name: "sender" }] };
 * const sig = getSignature(error); // "Unauthorized(address)"
 * ```
 */
export function getSignature<TName extends string, TInputs extends readonly import("../parameter/index.js").BrandedParameter[]>(error: import("./ErrorType.js").ErrorType<TName, TInputs>): string;
//# sourceMappingURL=getSignature.d.ts.map