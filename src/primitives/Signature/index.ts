// Re-export BrandedSignature types and all functions
export type {
	BrandedSignature,
	SignatureAlgorithm,
} from "./BrandedSignature/index.js";

// Re-export errors
export {
	SignatureError,
	InvalidSignatureLengthError,
	InvalidSignatureFormatError,
	InvalidAlgorithmError,
	NonCanonicalSignatureError,
	InvalidDERError,
} from "./BrandedSignature/index.js";

// Re-export constants
export {
	ECDSA_SIZE,
	ECDSA_WITH_V_SIZE,
	ED25519_SIZE,
	COMPONENT_SIZE,
	RECOVERY_ID_MIN,
	RECOVERY_ID_MAX,
} from "./BrandedSignature/index.js";

// Namespace export for tree-shakable API
export * as Signature from "./BrandedSignature/index.js";
