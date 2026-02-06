/**
 * Check if transaction is a contract creation
 * @param this Transaction
 * @returns True if to field is null
 */
// biome-ignore lint/suspicious/noExplicitAny: generic transaction type
export function isContractCreation() {
    return this.to === null;
}
