import { Type, type Any } from "./types.js";
import * as Legacy from "./Legacy/verifySignature.js";
import * as EIP2930 from "./EIP2930/verifySignature.js";
import * as EIP1559 from "./EIP1559/verifySignature.js";
import * as EIP4844 from "./EIP4844/verifySignature.js";
import * as EIP7702 from "./EIP7702/verifySignature.js";

/**
 * Verify transaction signature
 */
export function verifySignature(tx: Any): boolean {
	switch (tx.type) {
		case Type.Legacy:
			return Legacy.verifySignature.call(tx);
		case Type.EIP2930:
			return EIP2930.verifySignature.call(tx);
		case Type.EIP1559:
			return EIP1559.verifySignature.call(tx);
		case Type.EIP4844:
			return EIP4844.verifySignature.call(tx);
		case Type.EIP7702:
			return EIP7702.verifySignature.call(tx);
		default:
			throw new Error(`Unknown transaction type: ${(tx as any).type}`);
	}
}
