/**
 * Check if transaction is a contract call
 * @param this Transaction
 * @returns True if to exists and data is present
 */
// biome-ignore lint/suspicious/noExplicitAny: generic transaction type
export function isContractCall() {
    return this.to !== null && this.data.length > 0;
}
