import { Bytes16 } from "@tevm/voltaire/Bytes";

export type { Bytes16Type } from "@tevm/voltaire/Bytes";

export type Bytes16Like = Bytes16Type | string | Uint8Array;

export const {
	SIZE,
	ZERO,
	from,
	fromBytes,
	fromHex,
	toHex,
	toUint8Array,
	equals,
	compare,
	clone,
	size,
	zero,
	isZero,
} = Bytes16;

export { Bytes16 };
