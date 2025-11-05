import type {
	AbiParameterToPrimitiveType,
	AbiParameter as AbiTypeParameter,
	AbiParametersToPrimitiveTypes as AbiTypeParametersToPrimitiveTypes,
} from "abitype";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
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

export type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = {
	[K in keyof TParams]: TParams[K] extends Parameter<infer TType, any, any>
		? TType extends "address"
			? BrandedAddress
			: TParams[K] extends AbiTypeParameter
				? AbiParameterToPrimitiveType<TParams[K]>
				: AbiTypeParametersToPrimitiveTypes<[TParams[K] & AbiTypeParameter]>[0]
		: never;
};

export type ParametersToObject<TParams extends readonly Parameter[]> = {
	[K in TParams[number] as K extends { name: infer TName extends string }
		? TName
		: never]: K extends Parameter<infer TType, any, any>
		? TType extends "address"
			? BrandedAddress
			: K extends AbiTypeParameter
				? AbiParameterToPrimitiveType<K>
				: AbiTypeParametersToPrimitiveTypes<[K & AbiTypeParameter]>[0]
		: never;
};
