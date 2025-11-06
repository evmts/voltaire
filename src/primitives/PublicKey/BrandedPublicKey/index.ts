// Export type definition
export type { BrandedPublicKey } from "./BrandedPublicKey.js";

// Import all functions
import { from } from "./from.js";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { toHex as _toHex } from "./toHex.js";
import { toAddress as _toAddress } from "./toAddress.js";
import { verify as _verify } from "./verify.js";

// Export constructors
export { from, fromPrivateKey };

// Export public wrapper functions
export function toHex(publicKey: string): string {
	return _toHex.call(from(publicKey));
}

export function toAddress(publicKey: string) {
	return _toAddress.call(from(publicKey));
}

export function verify(publicKey: string, hash: any, signature: any): boolean {
	return _verify.call(from(publicKey), hash, signature);
}

// Export internal functions (tree-shakeable)
export { _toHex, _toAddress, _verify };

// Export as namespace (convenience)
export const PublicKey = {
	from,
	fromPrivateKey,
	toHex,
	toAddress,
	verify,
};
