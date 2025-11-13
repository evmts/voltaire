// Export type definition
export type { BrandedPrivateKey } from "./BrandedPrivateKey.js";

// Import crypto dependencies
import { sign as secp256k1Sign } from "../../../crypto/Secp256k1/sign.js";

// Import all functions
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { Sign } from "./sign.js";
import { toAddress as _toAddress } from "./toAddress.js";
import { toHex as _toHex } from "./toHex.js";
import { toPublicKey as _toPublicKey } from "./toPublicKey.js";

// Export constructors (no wrapper needed)
export { from, fromBytes };

// Export factories (tree-shakeable)
export { Sign };

// Instantiate with crypto dependencies
const _sign = Sign({ secp256k1Sign });

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

export function sign(
	privateKey: string,
	hash: import("../../Hash/BrandedHash/BrandedHash.js").BrandedHash,
) {
	return _sign(from(privateKey), hash);
}

// Export internal functions (tree-shakeable)
export { _toHex, _toPublicKey, _toAddress, _sign };

// Export as namespace (convenience)
export const PrivateKey = {
	from,
	fromBytes,
	toHex,
	toPublicKey,
	toAddress,
	sign,
};
