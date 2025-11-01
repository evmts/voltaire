import { Type, type Any } from "./types.js";
import * as Legacy from "./Legacy/serialize.js";
import * as EIP2930 from "./EIP2930/serialize.js";
import * as EIP1559 from "./EIP1559/serialize.js";
import * as EIP4844 from "./EIP4844/serialize.js";
import * as EIP7702 from "./EIP7702/serialize.js";

/**
 * Serialize transaction to RLP encoded bytes
 */
export function serialize(tx: Any): Uint8Array {
	switch (tx.type) {
		case Type.Legacy:
			return Legacy.serialize.call(tx);
		case Type.EIP2930:
			return EIP2930.serialize.call(tx);
		case Type.EIP1559:
			return EIP1559.serialize.call(tx);
		case Type.EIP4844:
			return EIP4844.serialize.call(tx);
		case Type.EIP7702:
			return EIP7702.serialize.call(tx);
		default:
			throw new Error(`Unknown transaction type: ${(tx as any).type}`);
	}
}
