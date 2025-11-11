import type { AbiParameter as AbiTypeParameter } from "abitype";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { AbiParameterToPrimitiveTypeWithUint8Array } from "./abitype-uint8array.js";
import type { AbiType } from "./Type.js";

export type Parameter<
	TType extends AbiType = AbiType,
	TName extends string = string,
	TInternalType extends string = string,
> = {
	readonly type: TType;
	readonly name?: TName;
	readonly internalType?: TInternalType;
	readonly indexed?: boolean;
	readonly components?: readonly Parameter[];
};

// Helper type to recursively convert Parameter components to AbiTypeParameter components
type ConvertComponents<T> = T extends readonly Parameter[]
	? {
			readonly [K in keyof T]: T[K] extends Parameter
				? ConvertToAbiParameter<T[K]>
				: T[K];
		}
	: never;

// Helper to convert our Parameter type to abitype's AbiTypeParameter
// Must preserve exact name type (not optional) for abitype tuple->object conversion
type ConvertToAbiParameter<T extends Parameter> = {
	readonly type: T["type"];
} & (undefined extends T["name"]
	? {}
	: T["name"] extends string
		? { readonly name: T["name"] }
		: {}) &
	(undefined extends T["internalType"]
		? {}
		: T["internalType"] extends string
			? { readonly internalType: T["internalType"] }
			: {}) &
	(undefined extends T["indexed"]
		? {}
		: T["indexed"] extends boolean
			? { readonly indexed: T["indexed"] }
			: {}) &
	(T["components"] extends readonly Parameter[]
		? { readonly components: ConvertComponents<T["components"]> }
		: {});

// Resolve basic parameter type (no tuples)
type ResolveBasicParameterType<T extends Parameter> = T["type"] extends "address"
	? BrandedAddress
	: T["type"] extends "address[]"
		? BrandedAddress[]
		: T["type"] extends `address[${string}]`
			? readonly BrandedAddress[]
			: AbiParameterToPrimitiveTypeWithUint8Array<ConvertToAbiParameter<T>>;

// Build a fixed-size tuple type
type BuildFixedTuple<T, N extends number, Acc extends readonly T[] = []> =
	Acc["length"] extends N ? Acc : BuildFixedTuple<T, N, readonly [T, ...Acc]>;

// Helper to recursively resolve a single component
type ResolveComponent<T extends Parameter> = T["type"] extends "tuple"
	? T extends { components: infer C extends readonly Parameter[] }
		? TupleComponentsToObject<C>
		: never
	: T["type"] extends `tuple[${infer Size}]`
		? T extends { components: infer C extends readonly Parameter[] }
			? Size extends `${infer N extends number}`
				? BuildFixedTuple<TupleComponentsToObject<C>, N>
				: readonly TupleComponentsToObject<C>[]
			: never
		: T["type"] extends "tuple[]"
			? T extends { components: infer C extends readonly Parameter[] }
				? TupleComponentsToObject<C>[]
				: never
			: ResolveBasicParameterType<T>;

// Custom tuple-to-object converter that handles components recursively
// Uses union distribution to map each component to its field
type TupleComponentsToObject<TComponents extends readonly Parameter[]> = {
	[K in TComponents[number] as K extends Parameter<any, infer N, any>
		? N extends string
			? N
			: never
		: never]: K extends Parameter ? ResolveComponent<K> : never;
};

// Resolve a single parameter type, handling tuples specially
type ResolveSingleParameter<T extends Parameter> = T["type"] extends "tuple"
	? T extends { components: infer C extends readonly Parameter[] }
		? TupleComponentsToObject<C>
		: never
	: T["type"] extends `tuple[${infer Size}]`
		? T extends { components: infer C extends readonly Parameter[] }
			? Size extends `${infer N extends number}`
				? BuildFixedTuple<TupleComponentsToObject<C>, N>
				: readonly TupleComponentsToObject<C>[]
			: never
		: T["type"] extends "tuple[]"
			? T extends { components: infer C extends readonly Parameter[] }
				? TupleComponentsToObject<C>[]
				: never
			: ResolveBasicParameterType<T>;

export type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = {
	[K in keyof TParams]: TParams[K] extends Parameter
		? ResolveSingleParameter<TParams[K]>
		: never;
};

export type ParametersToObject<TParams extends readonly Parameter[]> = {
	[K in TParams[number] as K["name"] extends string
		? K["name"]
		: never]: K extends Parameter ? ResolveSingleParameter<K> : never;
};
