/**
 * Get recipient address from transaction
 * @param this Transaction
 * @returns Address or null for contract creation
 */
export function getRecipient(this: { to: any }): any {
	return this.to;
}
