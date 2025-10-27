/**
 * Extended address utilities
 * Validation, ICAP format, Addressable interface
 */

export type Hex = `0x${string}`;

/**
 * Addressable interface
 */
export interface Addressable {
	getAddress(): Promise<Hex>;
}

/**
 * Validate if value is valid address
 */
export function isAddress(value: unknown): value is Hex {
	throw new Error("not implemented");
}

/**
 * Check if object is Addressable
 */
export function isAddressable(value: unknown): value is Addressable {
	throw new Error("not implemented");
}

/**
 * Get normalized checksummed address
 */
export function getAddress(address: Hex): Hex {
	throw new Error("not implemented");
}

/**
 * Convert to ICAP format (deprecated)
 */
export function getIcapAddress(address: Hex): string {
	throw new Error("not implemented");
}

/**
 * Resolve address from Addressable or string
 */
export function resolveAddress(
	target: Hex | Addressable | Promise<Hex>,
): Promise<Hex> {
	throw new Error("not implemented");
}
