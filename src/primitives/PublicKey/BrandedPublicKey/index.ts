// Export type definition
export type { BrandedPublicKey } from "./BrandedPublicKey.js";

// Import crypto dependencies
import { verify as secp256k1Verify } from "../../../crypto/Secp256k1/verify.js";

// Import all functions
import { from } from "./from.js";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { toAddress as _toAddress } from "./toAddress.js";
import { toHex as _toHex } from "./toHex.js";
import { Verify } from "./verify.js";

// Export constructors
export { from, fromPrivateKey };

// Export factories (tree-shakeable)
export { Verify };

// Instantiate with crypto dependencies
const _verify = Verify({ secp256k1Verify });

// Export public wrapper functions
export function toHex(publicKey: string): string {
	return _toHex.call(from(publicKey));
}

export function toAddress(publicKey: string) {
	return _toAddress.call(from(publicKey));
}

export function verify(
	publicKey: string,
	hash: import("../../Hash/BrandedHash/BrandedHash.js").BrandedHash,
	signature: import("../../Signature/BrandedSignature/BrandedSignature.js").BrandedSignature,
): boolean {
	return _verify(from(publicKey), hash, signature);
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
