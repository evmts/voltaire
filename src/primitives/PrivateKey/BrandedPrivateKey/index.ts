// Export type definition
export type { BrandedPrivateKey } from "./BrandedPrivateKey.js";

// Import all functions
import { from } from "./from.js";
import { sign as _sign } from "./sign.js";
import { toAddress as _toAddress } from "./toAddress.js";
import { toHex as _toHex } from "./toHex.js";
import { toPublicKey as _toPublicKey } from "./toPublicKey.js";

// Export constructors (no wrapper needed)
export { from };

// Export public wrapper functions
export function toHex(privateKey: string): string {
	return _toHex.call(from(privateKey));
}

export function toPublicKey(privateKey: string) {
	return _toPublicKey.call(from(privateKey));
}

export function toAddress(privateKey: string) {
	return _toAddress.call(from(privateKey));
}

export function sign(privateKey: string, hash: any) {
	return _sign.call(from(privateKey), hash);
}

// Export internal functions (tree-shakeable)
export { _toHex, _toPublicKey, _toAddress, _sign };

// Export as namespace (convenience)
export const PrivateKey = {
	from,
	toHex,
	toPublicKey,
	toAddress,
	sign,
};
