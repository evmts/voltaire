import { Bytes64 } from "@tevm/voltaire/Bytes";

export type { Bytes64Type } from "@tevm/voltaire/Bytes";

export type Bytes64Like = Bytes64Type | string | Uint8Array;

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
} = Bytes64;

export { Bytes64 };
