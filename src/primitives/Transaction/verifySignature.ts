import * as EIP1559 from "./EIP1559/verifySignature.js";
import * as EIP2930 from "./EIP2930/verifySignature.js";
import * as EIP4844 from "./EIP4844/verifySignature.js";
import * as EIP7702 from "./EIP7702/verifySignature.js";
import * as Legacy from "./Legacy/verifySignature.js";
import { type Any, Type } from "./types.js";

/**
 * Verify transaction signature
 */
export function verifySignature(this: Any): boolean {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.verifySignature.call(this);
		case Type.EIP2930:
			return EIP2930.verifySignature.call(this);
		case Type.EIP1559:
			return EIP1559.verifySignature.call(this);
		case Type.EIP4844:
			return EIP4844.verifySignature.call(this);
		case Type.EIP7702:
			return EIP7702.verifySignature.call(this);
		default:
			throw new Error(`Unknown transaction type: ${(this as any).type}`);
	}
}
