import { Type, type Any } from "./types.js";

/**
 * Format transaction to human-readable string
 */
export function format(tx: Any): string {
	const typeNames = {
		[Type.Legacy]: "Legacy",
		[Type.EIP2930]: "EIP-2930",
		[Type.EIP1559]: "EIP-1559",
		[Type.EIP4844]: "EIP-4844",
		[Type.EIP7702]: "EIP-7702",
	};

	const typeName = typeNames[tx.type];
	const toStr = tx.to ? `to ${tx.to}` : "contract creation";
	const valueEth = Number(tx.value) / 1e18;

	return `${typeName} tx ${toStr}, value: ${valueEth} ETH, nonce: ${tx.nonce}`;
}
