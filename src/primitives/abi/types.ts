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
 * Valid ABI type strings
 *
 * Includes all Solidity types:
 * - Elementary: uint, int, address, bool, bytes, string, bytesN
 * - Arrays: T[], T[N]
 * - Tuples: tuple (represented with components)
 */
export type AbiType =
  // Unsigned integers
  | "uint" | "uint8" | "uint16" | "uint24" | "uint32" | "uint40" | "uint48" | "uint56" | "uint64"
  | "uint72" | "uint80" | "uint88" | "uint96" | "uint104" | "uint112" | "uint120" | "uint128"
  | "uint136" | "uint144" | "uint152" | "uint160" | "uint168" | "uint176" | "uint184" | "uint192"
  | "uint200" | "uint208" | "uint216" | "uint224" | "uint232" | "uint240" | "uint248" | "uint256"
  // Signed integers
  | "int" | "int8" | "int16" | "int24" | "int32" | "int40" | "int48" | "int56" | "int64"
  | "int72" | "int80" | "int88" | "int96" | "int104" | "int112" | "int120" | "int128"
  | "int136" | "int144" | "int152" | "int160" | "int168" | "int176" | "int184" | "int192"
  | "int200" | "int208" | "int216" | "int224" | "int232" | "int240" | "int248" | "int256"
  // Other elementary types
  | "address" | "bool" | "string" | "bytes"
  // Fixed-size bytes
  | "bytes1" | "bytes2" | "bytes3" | "bytes4" | "bytes5" | "bytes6" | "bytes7" | "bytes8"
  | "bytes9" | "bytes10" | "bytes11" | "bytes12" | "bytes13" | "bytes14" | "bytes15" | "bytes16"
  | "bytes17" | "bytes18" | "bytes19" | "bytes20" | "bytes21" | "bytes22" | "bytes23" | "bytes24"
  | "bytes25" | "bytes26" | "bytes27" | "bytes28" | "bytes29" | "bytes30" | "bytes31" | "bytes32"
  // Tuples
  | "tuple"
  // Arrays and fixed arrays (string patterns)
  | `${string}[]` | `${string}[${number}]`;

/**
 * ABI Parameter with generic type tracking
 */
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
