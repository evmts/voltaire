import * as EIP1559 from "./EIP1559/deserialize.js";
import * as EIP2930 from "./EIP2930/deserialize.js";
import * as EIP4844 from "./EIP4844/deserialize.js";
import * as EIP7702 from "./EIP7702/deserialize.js";
import * as Legacy from "./Legacy/deserialize.js";
import { detectType } from "./detectType.js";
import { type Any, Type } from "./types.js";

/**
 * Deserialize RLP encoded transaction
 */
export function deserialize(data: Uint8Array): Any {
	const type = detectType(data);
	switch (type) {
		case Type.Legacy:
			return Legacy.deserialize(data);
		case Type.EIP2930:
			return EIP2930.deserialize(data);
		case Type.EIP1559:
			return EIP1559.deserialize(data);
		case Type.EIP4844:
			return EIP4844.deserialize(data);
		case Type.EIP7702:
			return EIP7702.deserialize(data);
		default:
			throw new Error(`Unknown transaction type: ${type}`);
	}
}
