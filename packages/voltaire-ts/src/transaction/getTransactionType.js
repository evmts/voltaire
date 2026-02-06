/**
 * Get transaction type string from hex type
 * @param {string | undefined} typeHex
 * @returns {"legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702"}
 */
export function getTransactionType(typeHex) {
	if (!typeHex) return "legacy";
	const type = Number.parseInt(typeHex, 16);
	switch (type) {
		case 0:
			return "legacy";
		case 1:
			return "eip2930";
		case 2:
			return "eip1559";
		case 3:
			return "eip4844";
		case 4:
			return "eip7702";
		default:
			return "legacy";
	}
}
