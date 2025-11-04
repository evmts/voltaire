import type { Address } from "../Address/index.js";
import * as EIP1559 from "./EIP1559/getSender.js";
import * as EIP2930 from "./EIP2930/getSender.js";
import * as EIP4844 from "./EIP4844/getSender.js";
import * as EIP7702 from "./EIP7702/getSender.js";
import * as Legacy from "./Legacy/getSender.js";
import { type Any, Type } from "./types.js";

/**
 * Get sender address from transaction signature
 */
export function getSender(this: Any): Address {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.getSender.call(this);
		case Type.EIP2930:
			return EIP2930.getSender.call(this);
		case Type.EIP1559:
			return EIP1559.getSender.call(this);
		case Type.EIP4844:
			return EIP4844.getSender.call(this);
		case Type.EIP7702:
			return EIP7702.getSender.call(this);
		default:
			throw new Error(`Unknown transaction type: ${(this as any).type}`);
	}
}
