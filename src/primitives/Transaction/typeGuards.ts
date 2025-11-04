import {
	type Any,
	type EIP1559,
	type EIP2930,
	type EIP4844,
	type EIP7702,
	type Legacy,
	Type,
} from "./types.js";

/**
 * Check if transaction is Legacy type
 */
export function isLegacy(tx: Any): tx is Legacy {
	return tx.type === Type.Legacy;
}

/**
 * Check if transaction is EIP-2930 type
 */
export function isEIP2930(tx: Any): tx is EIP2930 {
	return tx.type === Type.EIP2930;
}

/**
 * Check if transaction is EIP-1559 type
 */
export function isEIP1559(tx: Any): tx is EIP1559 {
	return tx.type === Type.EIP1559;
}

/**
 * Check if transaction is EIP-4844 type
 */
export function isEIP4844(tx: Any): tx is EIP4844 {
	return tx.type === Type.EIP4844;
}

/**
 * Check if transaction is EIP-7702 type
 */
export function isEIP7702(tx: Any): tx is EIP7702 {
	return tx.type === Type.EIP7702;
}

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
