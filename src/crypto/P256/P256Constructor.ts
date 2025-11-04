import type { BrandedHash } from "../../primitives/Hash/index.js";
import type { derivePublicKey } from "./derivePublicKey.js";
import type { ecdh } from "./ecdh.js";
import type { sign } from "./sign.js";
import type { validatePrivateKey } from "./validatePrivateKey.js";
import type { validatePublicKey } from "./validatePublicKey.js";
import type { verify } from "./verify.js";
import type {
	CURVE_ORDER,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SHARED_SECRET_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} from "./constants.js";

export interface P256Constructor {
	sign: typeof sign;
	verify: typeof verify;
	derivePublicKey: typeof derivePublicKey;
	ecdh: typeof ecdh;
	validatePrivateKey: typeof validatePrivateKey;
	validatePublicKey: typeof validatePublicKey;
	CURVE_ORDER: typeof CURVE_ORDER;
	PRIVATE_KEY_SIZE: typeof PRIVATE_KEY_SIZE;
	PUBLIC_KEY_SIZE: typeof PUBLIC_KEY_SIZE;
	SIGNATURE_COMPONENT_SIZE: typeof SIGNATURE_COMPONENT_SIZE;
	SHARED_SECRET_SIZE: typeof SHARED_SECRET_SIZE;
}
