/**
 * Transaction utilities
 * Type detection, serialization, access list normalization
 */

export type Hex = `0x${string}`;

export interface AccessList {
	address: Hex;
	storageKeys: Hex[];
}

/**
 * Transaction class
 */
export class Transaction {
	type?: number;
	to?: Hex;
	from?: Hex;
	nonce?: number;
	gasLimit?: bigint;
	data?: Hex;
	value?: bigint;
	chainId?: bigint;

	// Legacy
	gasPrice?: bigint;

	// EIP-1559
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;

	// EIP-2930
	accessList?: AccessList[];

	// EIP-4844
	blobVersionedHashes?: Hex[];
	maxFeePerBlobGas?: bigint;

	/**
	 * Serialized transaction
	 */
	get serialized(): Hex {
		throw new Error("not implemented");
	}

	/**
	 * Unsigned serialized (pre-image for signing)
	 */
	get unsignedSerialized(): Hex {
		throw new Error("not implemented");
	}

	/**
	 * Unsigned hash (digest to sign)
	 */
	get unsignedHash(): Hex {
		throw new Error("not implemented");
	}

	/**
	 * Check if transaction is signed
	 */
	isSigned(): boolean {
		throw new Error("not implemented");
	}

	/**
	 * Clone transaction
	 */
	clone(): Transaction {
		throw new Error("not implemented");
	}

	/**
	 * Infer transaction type
	 */
	inferType(): number {
		throw new Error("not implemented");
	}

	/**
	 * Get all compatible types
	 */
	inferTypes(): number[] {
		throw new Error("not implemented");
	}
}

/**
 * Infer transaction type from properties
 */
export function inferType(tx: Partial<Transaction>): number {
	throw new Error("not implemented");
}

/**
 * Get all compatible transaction types
 */
export function inferTypes(tx: Partial<Transaction>): number[] {
	throw new Error("not implemented");
}

/**
 * Check if transaction is legacy
 */
export function isLegacy(tx: Partial<Transaction>): boolean {
	throw new Error("not implemented");
}

/**
 * Check if transaction is Berlin (EIP-2930)
 */
export function isBerlin(tx: Partial<Transaction>): boolean {
	throw new Error("not implemented");
}

/**
 * Check if transaction is London (EIP-1559)
 */
export function isLondon(tx: Partial<Transaction>): boolean {
	throw new Error("not implemented");
}

/**
 * Check if transaction is Cancun (EIP-4844)
 */
export function isCancun(tx: Partial<Transaction>): boolean {
	throw new Error("not implemented");
}

/**
 * Normalize access list structure
 */
export function accessListify(
	accessList: AccessList[] | [Hex, Hex[]][],
): AccessList[] {
	throw new Error("not implemented");
}
