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
	? { readonly [K in keyof T]: ConvertToAbiParameter<T[K]> }
	: never;

// Helper to convert our Parameter type to abitype's AbiTypeParameter
type ConvertToAbiParameter<T extends Parameter> = {
	readonly type: T["type"];
	readonly name?: T["name"];
	readonly internalType?: T["internalType"];
	readonly indexed?: T["indexed"];
} & (T["components"] extends readonly Parameter[]
	? { readonly components: ConvertComponents<T["components"]> }
	: {});

// Helper to replace address types with BrandedAddress in abitype output
type ReplaceAddress<T> = T extends `0x${string}`
	? BrandedAddress
	: T extends readonly (infer U)[]
		? T extends readonly [infer A, infer B, infer C, infer D, infer E]
			? readonly [ReplaceAddress<A>, ReplaceAddress<B>, ReplaceAddress<C>, ReplaceAddress<D>, ReplaceAddress<E>]
			: T extends readonly [infer A, infer B, infer C, infer D]
				? readonly [ReplaceAddress<A>, ReplaceAddress<B>, ReplaceAddress<C>, ReplaceAddress<D>]
				: T extends readonly [infer A, infer B, infer C]
					? readonly [ReplaceAddress<A>, ReplaceAddress<B>, ReplaceAddress<C>]
					: T extends readonly [infer A, infer B]
						? readonly [ReplaceAddress<A>, ReplaceAddress<B>]
						: T extends readonly [infer A]
							? readonly [ReplaceAddress<A>]
							: readonly ReplaceAddress<U>[]
		: T extends object
			? T extends Uint8Array
				? T
				: T extends bigint
					? T
					: { [K in keyof T]: ReplaceAddress<T[K]> }
			: T;

// Main type resolver that converts Parameter to primitive type
type ResolveParameterType<T extends Parameter> = ReplaceAddress<
	AbiParameterToPrimitiveTypeWithUint8Array<ConvertToAbiParameter<T>>
>;

export type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = {
	[K in keyof TParams]: TParams[K] extends Parameter
		? ResolveParameterType<TParams[K]>
		: never;
};

export type ParametersToObject<TParams extends readonly Parameter[]> = {
	[K in TParams[number] as K extends { name: infer TName extends string }
		? TName
		: never]: K extends Parameter
			? ResolveParameterType<K>
			: never;
};
