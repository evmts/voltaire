import {
	UINT_ZERO,
	UINT_ONE,
	UINT_MAX_U8,
	UINT_MAX_U16,
	UINT_MAX_U32,
	UINT_MAX_U64,
	UINT_MAX_U128,
	UINT_MAX_U256,
} from "../../../native/primitives/branded-types/uint.js";

export function main(): void {
	// Access all constants multiple times
	for (let i = 0; i < 100; i++) {
		const _zero = UINT_ZERO;
		const _one = UINT_ONE;
		const _u8 = UINT_MAX_U8;
		const _u16 = UINT_MAX_U16;
		const _u32 = UINT_MAX_U32;
		const _u64 = UINT_MAX_U64;
		const _u128 = UINT_MAX_U128;
		const _u256 = UINT_MAX_U256;
	}
}
