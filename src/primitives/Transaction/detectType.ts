import { Type } from "./types.js";

/**
 * Detect transaction type from serialized data
 */
export function detectType(data: Uint8Array): Type {
	if (data.length === 0) {
		throw new Error("Empty transaction data");
	}

	const firstByte = data[0]!;

	// Legacy transactions start with RLP list prefix (0xc0-0xff)
	if (firstByte >= 0xc0) {
		return Type.Legacy;
	}

	// Typed transactions start with type byte
	switch (firstByte) {
		case Type.EIP2930:
			return Type.EIP2930;
		case Type.EIP1559:
			return Type.EIP1559;
		case Type.EIP4844:
			return Type.EIP4844;
		case Type.EIP7702:
			return Type.EIP7702;
		default:
			throw new Error(`Unknown transaction type: 0x${firstByte.toString(16)}`);
	}
}
