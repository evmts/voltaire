/**
 * Check if transaction is a contract call
 * @param this Transaction
 * @returns True if to exists and data is present
 */
export function isContractCall(this: {
	to: unknown;
	data: Uint8Array;
}): boolean {
	return this.to !== null && this.data.length > 0;
}
