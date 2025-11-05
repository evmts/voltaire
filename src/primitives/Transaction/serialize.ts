import * as EIP1559 from "./EIP1559/serialize.js";
import * as EIP2930 from "./EIP2930/serialize.js";
import * as EIP4844 from "./EIP4844/serialize.js";
import * as EIP7702 from "./EIP7702/serialize.js";
import * as Legacy from "./Legacy/serialize.js";
import { type Any, Type } from "./types.js";

/**
 * Serialize transaction to RLP encoded bytes
 */
export function serialize(this: Any): Uint8Array {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.serialize.call(this as any);
		case Type.EIP2930:
			return EIP2930.serialize(this as any);
		case Type.EIP1559:
			return EIP1559.serialize(this as any);
		case Type.EIP4844:
			return EIP4844.serialize(this as any);
		case Type.EIP7702:
			return EIP7702.serialize(this as any);
		default:
			throw new Error(`Unknown transaction type: ${(this as any).type}`);
	}
}
