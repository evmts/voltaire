import { Hash, type BrandedHash } from "../Hash/index.js";
import * as EIP1559 from "./EIP1559/getSigningHash.js";
import * as EIP2930 from "./EIP2930/getSigningHash.js";
import * as EIP4844 from "./EIP4844/getSigningHash.js";
import * as EIP7702 from "./EIP7702/getSigningHash.js";
import * as Legacy from "./Legacy/getSigningHash.js";
import { type Any, Type } from "./types.js";

/**
 * Get signing hash for transaction
 */
export function getSigningHash(this: Any): BrandedHash {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.getSigningHash.call(this);
		case Type.EIP2930:
			return EIP2930.getSigningHash.call(this);
		case Type.EIP1559:
			return EIP1559.getSigningHash.call(this);
		case Type.EIP4844:
			return EIP4844.getSigningHash.call(this);
		case Type.EIP7702:
			return EIP7702.getSigningHash.call(this);
		default:
			throw new Error(`Unknown transaction type: ${(this as any).type}`);
	}
}
