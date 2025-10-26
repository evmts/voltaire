// viem doesn't have branded Uint constants
// Using plain bigint constants

const UINT_ZERO = 0n;
const UINT_ONE = 1n;
const UINT_MAX_U8 = 0xffn;
const UINT_MAX_U16 = 0xffffn;
const UINT_MAX_U32 = 0xffffffffn;
const UINT_MAX_U64 = 0xffffffffffffffffn;
const UINT_MAX_U128 = (1n << 128n) - 1n;
const UINT_MAX_U256 = (1n << 256n) - 1n;

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
