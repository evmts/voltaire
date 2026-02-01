import { type Any, Type } from "./types.js";

/**
 * Format transaction to human-readable string
 */
export function format(this: Any): string {
	const typeNames = {
		[Type.Legacy]: "Legacy",
		[Type.EIP2930]: "EIP-2930",
		[Type.EIP1559]: "EIP-1559",
		[Type.EIP4844]: "EIP-4844",
		[Type.EIP7702]: "EIP-7702",
	};

	const typeName = typeNames[this.type];
	const toStr = this.to ? `to ${this.to}` : "contract creation";
	const valueEth = Number(this.value) / 1e18;

	return `${typeName} tx ${toStr}, value: ${valueEth} ETH, nonce: ${this.nonce}`;
}
