import type { BrandedAddress } from "../../Address/index.js";
import type { BrandedHash } from "../../Hash/index.js";
import type { BrandedAuthorization } from "./BrandedAuthorization.js";
import type { getAuthorizer } from "./getAuthorizer.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { verifySignature } from "./verifySignature.js";

type AuthorizationPrototype = BrandedAuthorization & {
	getSigningHash: typeof getSigningHash;
	verifySignature: typeof verifySignature;
	getAuthorizer: typeof getAuthorizer;
};

export interface AuthorizationConstructor {
	(auth: {
		chainId: bigint;
		address: BrandedAddress;
		nonce: bigint;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}): AuthorizationPrototype;
	prototype: AuthorizationPrototype;
	getSigningHash: typeof getSigningHash;
	verifySignature: typeof verifySignature;
	getAuthorizer: typeof getAuthorizer;
}
