import type { AbiType } from "./Type.js";
import type { Address } from "../Address/index.js";
import type {
  AbiParameter as AbiTypeParameter,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes as AbiTypeParametersToPrimitiveTypes,
} from "abitype";

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
      ? Address
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
      ? Address
      : K extends AbiTypeParameter
        ? AbiParameterToPrimitiveType<K>
        : AbiTypeParametersToPrimitiveTypes<[K & AbiTypeParameter]>[0]
    : never;
};
