/**
 * Branded types for Ethereum primitives
 *
 * Provides type-safe wrappers around hex strings with runtime validation.
 * Each branded type prevents accidental mixing of different hex formats.
 *
 * @module branded-types
 */

// Uint types
export {
	Uint,
	isUint,
	uintToBigInt,
	UINT_ZERO,
	UINT_ONE,
	UINT_MAX_U8,
	UINT_MAX_U16,
	UINT_MAX_U32,
	UINT_MAX_U64,
	UINT_MAX_U128,
	UINT_MAX_U256,
} from './uint';
export type { Uint } from './uint';

// Bytes types
export {
	Bytes,
	Byte,
	isBytes,
	isByte,
	bytesToUint8Array,
	byteToNumber,
	bytesLength,
	concatBytes,
	sliceBytes,
	BYTES_EMPTY,
	BYTE_ZERO,
	BYTE_MAX,
} from './bytes';
export type { Bytes, Byte } from './bytes';

// Hash types
export {
	Hash32,
	Bytes32,
	Bytes256,
	isHash32,
	isBytes32,
	isBytes256,
	hash32ToUint8Array,
	bytes32ToUint8Array,
	bytes256ToUint8Array,
	hash32ToBigInt,
	bigIntToHash32,
	fillHash32,
	fillBytes256,
	HASH32_ZERO,
	BYTES32_ZERO,
	BYTES256_ZERO,
} from './hash';
export type { Hash32, Bytes32, Bytes256 } from './hash';
