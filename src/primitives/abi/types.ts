/**
 * ABI Types and Type Utilities
 *
 * Core ABI type definitions for encoding/decoding Ethereum contract interfaces.
 * Includes type inference matching viem with support for complex types.
 */

import type { Address } from "../address.js";
import type {
  AbiParameter as AbiTypeParameter,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes as AbiTypeParametersToPrimitiveTypes,
} from "abitype";

// ==========================================================================
// Core Types
// ==========================================================================

export type StateMutability = "pure" | "view" | "nonpayable" | "payable";

/**
 * ABI Parameter with generic type tracking
 */
export type Parameter<
  TType extends string = string,
  TName extends string = string,
  TInternalType extends string = string,
> = {
  type: TType;
  name?: TName;
  internalType?: TInternalType;
  indexed?: boolean;
  components?: readonly Parameter[];
};

/**
 * ABI Function with generic tracking
 */
export type Function<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
  TOutputs extends readonly Parameter[] = readonly Parameter[],
> = {
  type: "function";
  name: TName;
  stateMutability: TStateMutability;
  inputs: TInputs;
  outputs: TOutputs;
};

/**
 * ABI Event with generic tracking
 */
export type Event<
  TName extends string = string,
  TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
  type: "event";
  name: TName;
  inputs: TInputs;
  anonymous?: boolean;
};

/**
 * ABI Error with generic tracking
 */
export type Error<
  TName extends string = string,
  TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
  type: "error";
  name: TName;
  inputs: TInputs;
};

/**
 * ABI Constructor with generic tracking
 */
export type Constructor<
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
  type: "constructor";
  stateMutability: TStateMutability;
  inputs: TInputs;
};

/**
 * ABI Fallback
 */
export type Fallback<TStateMutability extends StateMutability = StateMutability> = {
  type: "fallback";
  stateMutability: TStateMutability;
};

/**
 * ABI Receive
 */
export type Receive = {
  type: "receive";
  stateMutability: "payable";
};

/**
 * Any ABI item
 */
export type Item = Function | Event | Error | Constructor | Fallback | Receive;

// ==========================================================================
// Type Utilities
// ==========================================================================

/**
 * Extract function names from ABI
 */
export type ExtractFunctionNames<TAbi extends readonly Item[]> = Extract<
  TAbi[number],
  { type: "function" }
>["name"];

/**
 * Extract event names from ABI
 */
export type ExtractEventNames<TAbi extends readonly Item[]> = Extract<
  TAbi[number],
  { type: "event" }
>["name"];

/**
 * Extract error names from ABI
 */
export type ExtractErrorNames<TAbi extends readonly Item[]> = Extract<
  TAbi[number],
  { type: "error" }
>["name"];

/**
 * Get function from ABI by name
 */
export type GetFunction<TAbi extends readonly Item[], TName extends string> = Extract<
  TAbi[number],
  { type: "function"; name: TName }
>;

/**
 * Get event from ABI by name
 */
export type GetEvent<TAbi extends readonly Item[], TName extends string> = Extract<
  TAbi[number],
  { type: "event"; name: TName }
>;

/**
 * Get error from ABI by name
 */
export type GetError<TAbi extends readonly Item[], TName extends string> = Extract<
  TAbi[number],
  { type: "error"; name: TName }
>;

/**
 * Convert ABI parameters to primitive TypeScript types
 *
 * Enhanced with abitype for complete type inference including:
 * - uint/int variants -> bigint
 * - address -> Address (our custom type)
 * - bool -> boolean
 * - bytes/bytesN -> Uint8Array
 * - string -> string
 * - arrays -> Array<T>
 * - tuples -> readonly [T1, T2, ...]
 * - nested structs with full inference
 */
export type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = {
  [K in keyof TParams]: TParams[K] extends Parameter<infer TType, any, any>
    ? TType extends "address"
      ? Address // Use our custom Address type instead of abitype's `0x${string}`
      : TParams[K] extends AbiTypeParameter
        ? AbiParameterToPrimitiveType<TParams[K]>
        : AbiTypeParametersToPrimitiveTypes<[TParams[K] & AbiTypeParameter]>[0]
    : never;
};

/**
 * Convert ABI parameters to object with named properties
 *
 * Enhanced with abitype for complex types (tuples, arrays, nested structs)
 */
export type ParametersToObject<TParams extends readonly Parameter[]> = {
  [K in TParams[number] as K extends { name: infer TName extends string }
    ? TName
    : never]: K extends Parameter<infer TType, any, any>
    ? TType extends "address"
      ? Address // Use our custom Address type
      : K extends AbiTypeParameter
        ? AbiParameterToPrimitiveType<K>
        : AbiTypeParametersToPrimitiveTypes<[K & AbiTypeParameter]>[0]
    : never;
};
