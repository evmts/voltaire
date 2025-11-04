import type { Address } from "../../Address/index.js";
import type { Hash } from "../../Hash/index.js";
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
		address: Address;
		nonce: bigint;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}): BrandedAuthorization;
	prototype: AuthorizationPrototype;
	getSigningHash: typeof getSigningHash;
	verifySignature: typeof verifySignature;
	getAuthorizer: typeof getAuthorizer;
}
