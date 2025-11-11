// Re-export everything from BrandedSignature
export type {
	BrandedSignature,
	SignatureAlgorithm,
} from "./BrandedSignature/index.js";

export {
	// Errors
	InvalidSignatureLengthError,
	InvalidSignatureFormatError,
	InvalidAlgorithmError,
	NonCanonicalSignatureError,
	InvalidDERError,
	// Constants
	ECDSA_SIZE,
	ECDSA_WITH_V_SIZE,
	ED25519_SIZE,
	COMPONENT_SIZE,
	RECOVERY_ID_MIN,
	RECOVERY_ID_MAX,
	// Constructor functions
	from,
	fromSecp256k1,
	fromP256,
	fromEd25519,
	fromCompact,
	fromDER,
	// Conversion functions
	toBytes,
	toCompact,
	toDER,
	// Utility functions
	getAlgorithm,
	getR,
	getS,
	getV,
	isCanonical,
	normalize,
	verify,
	is,
	equals,
} from "./BrandedSignature/index.js";

// Namespace export for tree-shakable API
export * as Signature from "./BrandedSignature/index.js";
