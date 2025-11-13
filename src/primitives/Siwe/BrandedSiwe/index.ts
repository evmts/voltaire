// @ts-nocheck
export * from "./BrandedMessage.js";

// Import crypto dependencies
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../../../crypto/Secp256k1/recoverPublicKey.js";
import { FromPublicKey } from "../../Address/BrandedAddress/fromPublicKey.js";

// Import factories
import { GetMessageHash } from "./getMessageHash.js";
import { Verify } from "./verify.js";
import { VerifyMessage } from "./verifyMessage.js";

// Export factories (tree-shakeable)
export { GetMessageHash, Verify, VerifyMessage };

// Import non-crypto functions
import { create } from "./create.js";
import { format } from "./format.js";
import { generateNonce } from "./generateNonce.js";
import { parse } from "./parse.js";
import { validate } from "./validate.js";

// Create crypto wrappers with auto-injected dependencies
const addressFromPublicKey = FromPublicKey({ keccak256 });
const getMessageHash = GetMessageHash({ keccak256 });
const verify = Verify({
	keccak256,
	secp256k1RecoverPublicKey,
	addressFromPublicKey,
});
const verifyMessage = VerifyMessage({
	keccak256,
	secp256k1RecoverPublicKey,
	addressFromPublicKey,
});

// Export individual functions (public API)
export {
	create,
	format,
	generateNonce,
	getMessageHash,
	parse,
	validate,
	verify,
	verifyMessage,
};

// Export internal functions (tree-shakeable)
export {
	create as _create,
	format as _format,
	generateNonce as _generateNonce,
	getMessageHash as _getMessageHash,
	parse as _parse,
	validate as _validate,
	verify as _verify,
	verifyMessage as _verifyMessage,
};

// Namespace export
export const BrandedSiwe = {
	create,
	format,
	generateNonce,
	getMessageHash,
	parse,
	validate,
	verify,
	verifyMessage,
};
