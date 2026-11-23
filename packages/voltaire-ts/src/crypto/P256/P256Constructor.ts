import type {
	CURVE_B,
	CURVE_ORDER,
	FIELD_PRIME,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SHARED_SECRET_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} from "./constants.js";
import type { derivePublicKey } from "./derivePublicKey.js";
import type { ecdh } from "./ecdh.js";
import type { isValidPublicKey } from "./isValidPublicKey.js";
import type { randomPrivateKey } from "./randomPrivateKey.js";
import type { sign } from "./sign.js";
import type { validatePrivateKey } from "./validatePrivateKey.js";
import type { validatePublicKey } from "./validatePublicKey.js";
import type { verify } from "./verify.js";

export interface P256Constructor {
	sign: typeof sign;
	verify: typeof verify;
	derivePublicKey: typeof derivePublicKey;
	ecdh: typeof ecdh;
	randomPrivateKey: typeof randomPrivateKey;
	validatePrivateKey: typeof validatePrivateKey;
	validatePublicKey: typeof validatePublicKey;
	isValidPublicKey: typeof isValidPublicKey;
	CURVE_ORDER: typeof CURVE_ORDER;
	FIELD_PRIME: typeof FIELD_PRIME;
	CURVE_B: typeof CURVE_B;
	PRIVATE_KEY_SIZE: typeof PRIVATE_KEY_SIZE;
	PUBLIC_KEY_SIZE: typeof PUBLIC_KEY_SIZE;
	SIGNATURE_COMPONENT_SIZE: typeof SIGNATURE_COMPONENT_SIZE;
	SHARED_SECRET_SIZE: typeof SHARED_SECRET_SIZE;
}
