/**
 * Check if transaction is a contract creation
 * @param this Transaction
 * @returns True if to field is null
 */
export function isContractCreation(this: { to: any }): boolean {
	return this.to === null;
}
