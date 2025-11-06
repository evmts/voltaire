// Type exports
export type {
	BrandedSignature,
	SignatureAlgorithm,
} from "./BrandedSignature.js";

// Export errors and constants
export * from "./errors.js";
export * from "./constants.js";

// Import all functions
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromCompact } from "./fromCompact.js";
import { fromDER } from "./fromDER.js";
import { fromEd25519 } from "./fromEd25519.js";
import { fromP256 } from "./fromP256.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";
import { getAlgorithm } from "./getAlgorithm.js";
import { getR } from "./getR.js";
import { getS } from "./getS.js";
import { getV } from "./getV.js";
import { is } from "./is.js";
import { isCanonical } from "./isCanonical.js";
import { normalize } from "./normalize.js";
import { toBytes } from "./toBytes.js";
import { toCompact } from "./toCompact.js";
import { toDER } from "./toDER.js";
import { verify } from "./verify.js";

// Export individual functions
export {
	from,
	fromSecp256k1,
	fromP256,
	fromEd25519,
	fromCompact,
	fromDER,
	toBytes,
	toCompact,
	toDER,
	getAlgorithm,
	getR,
	getS,
	getV,
	isCanonical,
	normalize,
	verify,
	is,
	equals,
};
