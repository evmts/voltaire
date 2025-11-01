import type { Address } from "../Address/index.js";
import { Type, type Any } from "./types.js";
import * as Legacy from "./Legacy/getSender.js";
import * as EIP2930 from "./EIP2930/getSender.js";
import * as EIP1559 from "./EIP1559/getSender.js";
import * as EIP4844 from "./EIP4844/getSender.js";
import * as EIP7702 from "./EIP7702/getSender.js";

/**
 * Get sender address from transaction signature
 */
export function getSender(tx: Any): Address {
	switch (tx.type) {
		case Type.Legacy:
			return Legacy.getSender.call(tx);
		case Type.EIP2930:
			return EIP2930.getSender.call(tx);
		case Type.EIP1559:
			return EIP1559.getSender.call(tx);
		case Type.EIP4844:
			return EIP4844.getSender.call(tx);
		case Type.EIP7702:
			return EIP7702.getSender.call(tx);
		default:
			throw new Error(`Unknown transaction type: ${(tx as any).type}`);
	}
}
