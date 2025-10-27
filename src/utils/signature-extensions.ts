/**
 * Extended signature utilities
 * Verification functions and Signature class
 */

export type Hex = `0x${string}`;

/**
 * Signature class with r, s, v components
 */
export class Signature {
	readonly r: Hex;
	readonly s: Hex;
	readonly v: number;
	readonly yParity: number;

	constructor(r: Hex, s: Hex, v: number) {
		this.r = r;
		this.s = s;
		this.v = v;
		this.yParity = v === 27 ? 0 : 1;
	}

	/**
	 * Create from 65-byte signature
	 */
	static from(signature: Hex): Signature {
		throw new Error("not implemented");
	}

	/**
	 * Serialize to 65-byte signature
	 */
	serialize(): Hex {
		throw new Error("not implemented");
	}

	/**
	 * Serialize to compact format (ERC-2098)
	 */
	toCompact(): Hex {
		throw new Error("not implemented");
	}

	/**
	 * Create from compact format
	 */
	static fromCompact(signature: Hex): Signature {
		throw new Error("not implemented");
	}
}

/**
 * Verify message signature
 * Recovers address and compares
 */
export function verifyMessage(
	message: string | Uint8Array,
	signature: Hex,
	address: Hex,
): boolean {
	throw new Error("not implemented");
}

/**
 * Verify EIP-712 typed data signature
 */
export function verifyTypedData(
	domain: Record<string, unknown>,
	types: Record<string, unknown[]>,
	value: Record<string, unknown>,
	signature: Hex,
	address: Hex,
): boolean {
	throw new Error("not implemented");
}

/**
 * Verify EIP-7702 authorization signature
 */
export function verifyAuthorization(
	authorization: {
		chainId: bigint;
		address: Hex;
		nonce: bigint;
	},
	signature: Hex,
	expectedSigner: Hex,
): boolean {
	throw new Error("not implemented");
}
