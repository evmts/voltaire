import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { AbiParameterToPrimitiveTypeWithUint8Array } from "./abitype-uint8array.js";
import type { AbiType } from "./Type.js";
export type Parameter<TType extends AbiType = AbiType, TName extends string = string, TInternalType extends string = string> = {
    readonly type: TType;
    readonly name?: TName;
    readonly internalType?: TInternalType;
    readonly indexed?: boolean;
    readonly components?: readonly Parameter[];
};
type ConvertComponents<T> = T extends readonly Parameter[] ? {
    readonly [K in keyof T]: T[K] extends Parameter ? ConvertToAbiParameter<T[K]> : T[K];
} : never;
type ConvertToAbiParameter<T extends Parameter> = {
    readonly type: T["type"];
} & (undefined extends T["name"] ? {} : T["name"] extends string ? {
    readonly name: T["name"];
} : {}) & (undefined extends T["internalType"] ? {} : T["internalType"] extends string ? {
    readonly internalType: T["internalType"];
} : {}) & (undefined extends T["indexed"] ? {} : T["indexed"] extends boolean ? {
    readonly indexed: T["indexed"];
} : {}) & (T["components"] extends readonly Parameter[] ? {
    readonly components: ConvertComponents<T["components"]>;
} : {});
type ResolveBasicParameterType<T extends Parameter> = T["type"] extends "address" ? BrandedAddress : T["type"] extends "address[]" ? BrandedAddress[] : T["type"] extends `address[${string}]` ? readonly BrandedAddress[] : AbiParameterToPrimitiveTypeWithUint8Array<ConvertToAbiParameter<T>>;
type BuildFixedTuple<T, N extends number, Acc extends readonly T[] = []> = Acc["length"] extends N ? Acc : BuildFixedTuple<T, N, readonly [T, ...Acc]>;
type ResolveComponent<T extends Parameter> = T["type"] extends "tuple" ? T extends {
    components: infer C extends readonly Parameter[];
} ? TupleComponentsToObject<C> : never : T["type"] extends `tuple[${infer Size}]` ? T extends {
    components: infer C extends readonly Parameter[];
} ? Size extends `${infer N extends number}` ? BuildFixedTuple<TupleComponentsToObject<C>, N> : readonly TupleComponentsToObject<C>[] : never : T["type"] extends "tuple[]" ? T extends {
    components: infer C extends readonly Parameter[];
} ? TupleComponentsToObject<C>[] : never : ResolveBasicParameterType<T>;
type TupleComponentsToObject<TComponents extends readonly Parameter[]> = {
    [K in TComponents[number] as K extends Parameter<any, infer N, any> ? N extends string ? N : never : never]: K extends Parameter ? ResolveComponent<K> : never;
};
type ResolveSingleParameter<T extends Parameter> = T["type"] extends "tuple" ? T extends {
    components: infer C extends readonly Parameter[];
} ? TupleComponentsToObject<C> : never : T["type"] extends `tuple[${infer Size}]` ? T extends {
    components: infer C extends readonly Parameter[];
} ? Size extends `${infer N extends number}` ? BuildFixedTuple<TupleComponentsToObject<C>, N> : readonly TupleComponentsToObject<C>[] : never : T["type"] extends "tuple[]" ? T extends {
    components: infer C extends readonly Parameter[];
} ? TupleComponentsToObject<C>[] : never : ResolveBasicParameterType<T>;
export type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = {
    [K in keyof TParams]: TParams[K] extends Parameter ? ResolveSingleParameter<TParams[K]> : never;
};
export type ParametersToObject<TParams extends readonly Parameter[]> = {
    [K in TParams[number] as K extends Parameter<any, infer N, any> ? N extends string ? N : never : never]: K extends Parameter ? ResolveSingleParameter<K> : never;
};
export {};
//# sourceMappingURL=Parameter.d.ts.map