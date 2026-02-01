import { Bytes32 } from "@tevm/voltaire/Bytes";

export type { Bytes32Type } from "@tevm/voltaire/Bytes";

export type Bytes32Like = Bytes32Type | string | Uint8Array | bigint | number;

export const {
	SIZE,
	ZERO,
	from,
	fromBytes,
	fromHex,
	fromNumber,
	fromBigint,
	toHex,
	toUint8Array,
	toBigint,
	toHash,
	toAddress,
	equals,
	compare,
	clone,
	size,
	zero,
	isZero,
} = Bytes32;

export { Bytes32 };
