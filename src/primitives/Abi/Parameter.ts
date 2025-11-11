import type { AbiParameter as AbiTypeParameter } from "abitype";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { AbiParameterToPrimitiveTypeWithUint8Array } from "./abitype-uint8array.js";
import type { AbiType } from "./Type.js";

export type Parameter<
	TType extends AbiType = AbiType,
	TName extends string = string,
	TInternalType extends string = string,
> = {
	type: TType;
	name?: TName;
	internalType?: TInternalType;
	indexed?: boolean;
	components?: readonly Parameter[];
};

// Helper type to recursively convert Parameter to AbiTypeParameter for abitype compatibility
type ParameterToAbiType<T> = T extends Parameter
	? {
			type: T["type"];
			name?: T["name"];
			internalType?: T["internalType"];
			indexed?: T["indexed"];
			components?: T["components"] extends readonly Parameter[]
				? { [K in keyof T["components"]]: ParameterToAbiType<T["components"][K]> }
				: undefined;
		}
	: never;

// Helper to resolve address types in abitype results
type ResolveAddressInAbiType<T> = T extends `0x${string}`
	? BrandedAddress
	: T extends readonly (infer U)[]
		? readonly ResolveAddressInAbiType<U>[]
		: T extends object
			? { [K in keyof T]: ResolveAddressInAbiType<T[K]> }
			: T;

// Helper to handle parameter type resolution with address override
type ResolveParameterType<T extends Parameter> =
	// First, convert to AbiType and resolve via abitype
	ResolveAddressInAbiType<AbiParameterToPrimitiveTypeWithUint8Array<ParameterToAbiType<T>>>;

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
