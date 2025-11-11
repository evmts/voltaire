/**
 * Local abitype configuration with Uint8Array for bytes types
 *
 * This file provides scoped abitype configuration that uses Uint8Array for bytes
 * instead of `0x${string}`. This declaration merging is scoped to this module and
 * does not affect downstream users who import abitype directly.
 *
 * @internal
 */

// Scoped declaration merging - only affects imports from this file
declare module "abitype" {
	export interface Register {
		bytesType: {
			inputs: Uint8Array;
			outputs: Uint8Array;
		};
		// Override intType to use bigint for all integer types (not just > 48 bits)
		intType: bigint;
	}
}

// Re-export abitype types with the scoped configuration applied
export type {
	AbiParameterToPrimitiveType as AbiParameterToPrimitiveTypeWithUint8Array,
	AbiParametersToPrimitiveTypes as AbiParametersToPrimitiveTypesWithUint8Array,
} from "abitype";
