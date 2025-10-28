/**
 * ABI (Application Binary Interface) Types and Utilities
 *
 * Complete ABI encoding/decoding with type inference matching viem.
 * All types namespaced under Abi for intuitive access.
 *
 * @example
 * ```typescript
 * import { Abi } from './abi.js';
 *
 * // Types
 * const func: Abi.Function = { ... };
 * const event: Abi.Event = { ... };
 *
 * // Operations
 * const data = Abi.Function.encodeFunctionData(func, args);
 * const logs = Abi.parseEventLogs(abi, logs);
 * ```
 */

import type { Address } from "./address.js";
import { Hash } from "./hash.js";
import type {
  AbiParameter as AbiTypeParameter,
  AbiFunction as AbiTypeFunction,
  AbiEvent as AbiTypeEvent,
  AbiError as AbiTypeError,
  AbiConstructor as AbiTypeConstructor,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes as AbiTypeParametersToPrimitiveTypes,
} from "abitype";

// ============================================================================
// Error Types
// ============================================================================

export class AbiEncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiEncodingError";
  }
}

export class AbiDecodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiDecodingError";
  }
}

export class AbiParameterMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiParameterMismatchError";
  }
}

export class AbiItemNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiItemNotFoundError";
  }
}

export class AbiInvalidSelectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiInvalidSelectorError";
  }
}

// ============================================================================
// Main Abi Namespace
// ============================================================================

export namespace Abi {
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

  // ==========================================================================
  // Parameter Operations
  // ==========================================================================

  export namespace Parameter {
    /**
     * Encode single parameter value
     *
     * @param value - Value to encode
     * @returns Encoded parameter data
     * @throws {AbiEncodingError} If encoding fails
     *
     * @example
     * ```typescript
     * const param: Abi.Parameter = { type: 'uint256', name: 'amount' };
     * const encoded = Abi.Parameter.encode.call(param, 1000n);
     * ```
     */
    export function encode<T extends Abi.Parameter>(
      this: T,
      value: unknown,
    ): Uint8Array {
      throw new AbiEncodingError("Not implemented");
    }

    /**
     * Decode single parameter value
     *
     * @param data - Encoded data
     * @returns Decoded parameter value
     * @throws {AbiDecodingError} If decoding fails
     *
     * @example
     * ```typescript
     * const param: Abi.Parameter = { type: 'uint256', name: 'amount' };
     * const value = Abi.Parameter.decode.call(param, data);
     * ```
     */
    export function decode<T extends Abi.Parameter>(
      this: T,
      data: Uint8Array,
    ): unknown {
      throw new AbiDecodingError("Not implemented");
    }
  }

  /**
   * Encode ABI parameters
   *
   * @param params - Parameter definitions
   * @param values - Values to encode
   * @returns Encoded data
   * @throws {AbiEncodingError} If encoding fails
   * @throws {AbiParameterMismatchError} If values don't match params
   *
   * @example
   * ```typescript
   * const params = [{ type: 'address' }, { type: 'uint256' }];
   * const encoded = Abi.encodeParameters(params, [address, amount]);
   * ```
   */
  export function encodeParameters<const TParams extends readonly Parameter[]>(
    params: TParams,
    values: ParametersToPrimitiveTypes<TParams>,
  ): Uint8Array {
    // TODO: Implement ABI parameter encoding
    // 1. Validate values match params length
    // 2. Encode each value according to its type
    // 3. Handle static vs dynamic types
    // 4. Return concatenated encoded data
    throw new AbiEncodingError("Not implemented");
  }

  /**
   * Decode ABI parameters
   *
   * @param params - Parameter definitions
   * @param data - Encoded data
   * @returns Decoded values
   * @throws {AbiDecodingError} If decoding fails
   *
   * @example
   * ```typescript
   * const params = [{ type: 'address' }, { type: 'uint256' }];
   * const values = Abi.decodeParameters(params, data);
   * ```
   */
  export function decodeParameters<const TParams extends readonly Parameter[]>(
    params: TParams,
    data: Uint8Array,
  ): ParametersToPrimitiveTypes<TParams> {
    // TODO: Implement ABI parameter decoding
    // 1. Read static data section
    // 2. Follow offsets for dynamic types
    // 3. Decode each parameter by type
    // 4. Return typed array
    throw new AbiDecodingError("Not implemented");
  }

  // ==========================================================================
  // Function Operations
  // ==========================================================================

  export namespace Function {
    /**
     * Get function selector (4 bytes)
     *
     * @throws {AbiEncodingError} If selector computation fails
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const selector = Abi.Function.getSelector.call(func);
     * ```
     */
    export function getSelector<T extends Abi.Function>(this: T): Uint8Array {
      const signature = getSignature.call(this);
      const hash = Hash.keccak256String(signature);
      return hash.slice(0, 4);
    }

    /**
     * Get function signature (e.g., "transfer(address,uint256)")
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const sig = Abi.Function.getSignature.call(func);
     * ```
     */
    export function getSignature<T extends Abi.Function>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode function input parameters
     *
     * @param args - Input argument values matching function inputs
     * @returns Encoded calldata (selector + encoded parameters)
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If args don't match inputs
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const data = Abi.Function.encodeParams.call(func, [address, amount]);
     * ```
     */
    export function encodeParams<T extends Abi.Function>(
      this: T,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      // TODO: concat(getSelector.call(this), encodeParameters(this.inputs, args))
      throw new AbiEncodingError("Not implemented");
    }

    /**
     * Decode function input parameters from calldata
     *
     * @param data - Calldata to decode (must start with function selector)
     * @returns Decoded input arguments
     * @throws {AbiDecodingError} If decoding fails
     * @throws {AbiInvalidSelectorError} If selector doesn't match
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const args = Abi.Function.decodeParams.call(func, data);
     * ```
     */
    export function decodeParams<T extends Abi.Function>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      // TODO: skip 4-byte selector, decodeParameters(this.inputs, data.slice(4))
      throw new AbiDecodingError("Not implemented");
    }

    /**
     * Encode function output result
     *
     * @param values - Output values matching function outputs
     * @returns Encoded result data
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If values don't match outputs
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'balanceOf', ... };
     * const result = Abi.Function.encodeResult.call(func, [balance]);
     * ```
     */
    export function encodeResult<T extends Abi.Function>(
      this: T,
      values: ParametersToPrimitiveTypes<T["outputs"]>,
    ): Uint8Array {
      // TODO: encodeParameters(this.outputs, values)
      throw new AbiEncodingError("Not implemented");
    }

    /**
     * Decode function output result
     *
     * @param data - Result data to decode
     * @returns Decoded output values
     * @throws {AbiDecodingError} If decoding fails
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'balanceOf', ... };
     * const result = Abi.Function.decodeResult.call(func, data);
     * ```
     */
    export function decodeResult<T extends Abi.Function>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["outputs"]> {
      // TODO: decodeParameters(this.outputs, data)
      throw new AbiDecodingError("Not implemented");
    }
  }

  // ==========================================================================
  // Event Operations
  // ==========================================================================

  export namespace Event {
    /**
     * Get event selector (32 bytes, topic0)
     *
     * @throws {AbiEncodingError} If selector computation fails
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const selector = Abi.Event.getSelector.call(event);
     * ```
     */
    export function getSelector<T extends Abi.Event>(this: T): Hash {
      const signature = getSignature.call(this);
      return Hash.keccak256String(signature);
    }

    /**
     * Get event signature (e.g., "Transfer(address,address,uint256)")
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const sig = Abi.Event.getSignature.call(event);
     * ```
     */
    export function getSignature<T extends Abi.Event>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode event topics for indexed parameters
     *
     * @param args - Indexed parameter values (partial, only indexed params)
     * @returns Array of topics (topic0 + indexed params)
     * @throws {AbiEncodingError} If encoding fails
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const topics = Abi.Event.encodeTopics.call(event, { from, to });
     * ```
     */
    export function encodeTopics<T extends Abi.Event>(
      this: T,
      args: Partial<ParametersToObject<T["inputs"]>>,
    ): (Hash | null)[] {
      // TODO:
      // 1. topic0 = getSelector.call(this)
      // 2. For each indexed parameter, hash if dynamic type, else encode
      // 3. Return array of topics
      throw new AbiEncodingError("Not implemented");
    }

    /**
     * Decode event log
     *
     * @param data - Non-indexed event data
     * @param topics - Event topics (topic0 + indexed params)
     * @returns Decoded event parameters as object
     * @throws {AbiDecodingError} If decoding fails
     * @throws {AbiInvalidSelectorError} If topic0 doesn't match selector
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const decoded = Abi.Event.decodeLog.call(event, data, topics);
     * ```
     */
    export function decodeLog<T extends Abi.Event>(
      this: T,
      data: Uint8Array,
      topics: readonly Hash[],
    ): ParametersToObject<T["inputs"]> {
      // TODO:
      // 1. Verify topics[0] matches selector
      // 2. Decode indexed params from topics
      // 3. Decode non-indexed params from data
      // 4. Combine into object
      throw new AbiDecodingError("Not implemented");
    }
  }

  // ==========================================================================
  // Error Operations
  // ==========================================================================

  export namespace Error {
    /**
     * Get error selector (4 bytes)
     *
     * @throws {AbiEncodingError} If selector computation fails
     *
     * @example
     * ```typescript
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const selector = Abi.Error.getSelector.call(error);
     * ```
     */
    export function getSelector<T extends Abi.Error>(this: T): Uint8Array {
      const signature = getSignature.call(this);
      const hash = Hash.keccak256String(signature);
      return hash.slice(0, 4);
    }

    /**
     * Get error signature (e.g., "InsufficientBalance(uint256,uint256)")
     *
     * @example
     * ```typescript
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const sig = Abi.Error.getSignature.call(error);
     * ```
     */
    export function getSignature<T extends Abi.Error>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode error parameters
     *
     * @param args - Error parameter values
     * @returns Encoded error data (selector + encoded parameters)
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If args don't match inputs
     *
     * @example
     * ```typescript
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const data = Abi.Error.encodeParams.call(error, [available, required]);
     * ```
     */
    export function encodeParams<T extends Abi.Error>(
      this: T,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      // TODO: concat(getSelector.call(this), encodeParameters(this.inputs, args))
      throw new AbiEncodingError("Not implemented");
    }

    /**
     * Decode error parameters
     *
     * @param data - Error data to decode (must start with error selector)
     * @returns Decoded error parameters
     * @throws {AbiDecodingError} If decoding fails
     * @throws {AbiInvalidSelectorError} If selector doesn't match
     *
     * @example
     * ```typescript
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const params = Abi.Error.decodeParams.call(error, data);
     * ```
     */
    export function decodeParams<T extends Abi.Error>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      // TODO: skip 4-byte selector, decodeParameters(this.inputs, data.slice(4))
      throw new AbiDecodingError("Not implemented");
    }
  }

  // ==========================================================================
  // Constructor Operations
  // ==========================================================================

  export namespace Constructor {
    /**
     * Encode constructor parameters with bytecode
     *
     * @param bytecode - Contract bytecode
     * @param args - Constructor argument values
     * @returns Deploy data (bytecode + encoded constructor args)
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If args don't match inputs
     *
     * @example
     * ```typescript
     * const constructor: Abi.Constructor = { type: 'constructor', ... };
     * const deployData = Abi.Constructor.encodeParams.call(constructor, bytecode, [arg1, arg2]);
     * ```
     */
    export function encodeParams<T extends Abi.Constructor>(
      this: T,
      bytecode: Uint8Array,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      // TODO: concat(bytecode, encodeParameters(this.inputs, args))
      throw new AbiEncodingError("Not implemented");
    }

    /**
     * Decode constructor parameters from deploy data
     *
     * @param data - Deploy transaction data
     * @param bytecodeLength - Length of contract bytecode
     * @returns Decoded constructor arguments
     * @throws {AbiDecodingError} If decoding fails
     *
     * @example
     * ```typescript
     * const constructor: Abi.Constructor = { type: 'constructor', ... };
     * const args = Abi.Constructor.decodeParams.call(constructor, data, bytecode.length);
     * ```
     */
    export function decodeParams<T extends Abi.Constructor>(
      this: T,
      data: Uint8Array,
      bytecodeLength: number,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      // TODO: decodeParameters(this.inputs, data.slice(bytecodeLength))
      throw new AbiDecodingError("Not implemented");
    }
  }

  // ==========================================================================
  // Abi-Level Operations (operate on full ABI)
  // ==========================================================================

  /**
   * Get ABI item by name and optionally type
   */
  export function getItem<
    TAbi extends readonly Item[],
    TName extends string,
    TType extends Item["type"] | undefined = undefined,
  >(
    this: TAbi,
    name: TName,
    type?: TType,
  ): Extract<TAbi[number], { name: TName }> | undefined {
    return this.find(
      (item) =>
        "name" in item &&
        item.name === name &&
        (type === undefined || item.type === type),
    ) as any;
  }

  /**
   * Encode function data using function name
   *
   * @param functionName - Name of function to encode
   * @param args - Function argument values
   * @returns Encoded calldata (selector + params)
   * @throws {AbiItemNotFoundError} If function not found in ABI
   * @throws {AbiEncodingError} If encoding fails
   * @throws {AbiParameterMismatchError} If args don't match function inputs
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const data = Abi.encode.call(abi, "transfer", [address, amount]);
   * ```
   */
  export function encode<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    this: TAbi,
    functionName: TFunctionName,
    args: ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["inputs"]>,
  ): Uint8Array {
    const fn = getItem.call(this, functionName, "function");
    if (!fn) throw new AbiItemNotFoundError(`Function ${functionName} not found`);
    return Function.encodeParams.call(fn as any, args);
  }

  /**
   * Decode function result using function name
   *
   * @param functionName - Name of function to decode result for
   * @param data - Result data to decode
   * @returns Decoded output values
   * @throws {AbiItemNotFoundError} If function not found in ABI
   * @throws {AbiDecodingError} If decoding fails
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const result = Abi.decode.call(abi, "balanceOf", data);
   * ```
   */
  export function decode<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    this: TAbi,
    functionName: TFunctionName,
    data: Uint8Array,
  ): ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["outputs"]> {
    const fn = getItem.call(this, functionName, "function");
    if (!fn) throw new AbiItemNotFoundError(`Function ${functionName} not found`);
    return Function.decodeResult.call(fn as any, data);
  }

  /**
   * Decode function call data (infer function from selector)
   *
   * @param data - Calldata to decode
   * @returns Decoded function name and arguments
   * @throws {AbiDecodingError} If decoding fails
   * @throws {AbiItemNotFoundError} If selector doesn't match any function
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const { functionName, args } = Abi.decodeData.call(abi, calldata);
   * ```
   */
  export function decodeData<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    this: TAbi,
    data: Uint8Array,
  ): {
    functionName: TFunctionName;
    args: ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["inputs"]>;
  } {
    // TODO:
    // 1. Extract selector from data[0:4]
    // 2. Find matching function in abi
    // 3. Decode args
    // 4. Return { functionName, args }
    throw new AbiDecodingError("Not implemented");
  }

  /**
   * Parse event logs from array of logs
   *
   * @param logs - Array of logs to parse
   * @returns Array of parsed event logs with decoded arguments
   * @throws {AbiDecodingError} If log decoding fails
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const parsed = Abi.parseLogs.call(abi, logs);
   * ```
   */
  export function parseLogs<TAbi extends readonly Item[]>(
    this: TAbi,
    logs: Array<{ topics: readonly Hash[]; data: Uint8Array }>,
  ): Array<{
    eventName: ExtractEventNames<TAbi>;
    args: unknown;
    log: { topics: readonly Hash[]; data: Uint8Array };
  }> {
    // TODO:
    // 1. For each log, extract topic0
    // 2. Find matching event in abi
    // 3. Decode using Event.decodeLog
    // 4. Return array of parsed logs
    throw new AbiDecodingError("Not implemented");
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Encode packed (Solidity's abi.encodePacked)
   *
   * No padding, tightly packed encoding.
   */
  export function encodePacked(
    types: readonly string[],
    values: readonly unknown[],
  ): Uint8Array {
    // TODO:
    // 1. No 32-byte padding
    // 2. Dynamic types encoded directly without length prefix
    // 3. Static types encoded as minimal bytes
    throw new Error("Not implemented");
  }

  /**
   * Format ABI item to human-readable string
   *
   * @example "function transfer(address to, uint256 amount) returns (bool)"
   */
  export function formatAbiItem(item: Item): string {
    if (!("name" in item)) {
      return item.type;
    }

    const inputs =
      "inputs" in item
        ? item.inputs.map((p) => `${p.type}${p.name ? ` ${p.name}` : ""}`).join(", ")
        : "";

    let result = `${item.type} ${item.name}(${inputs})`;

    if (item.type === "function" && item.outputs.length > 0) {
      const outputs = item.outputs.map((p) => p.type).join(", ");
      result += ` returns (${outputs})`;
    }

    if ("stateMutability" in item && item.stateMutability !== "nonpayable") {
      result += ` ${item.stateMutability}`;
    }

    return result;
  }

  /**
   * Format ABI item with argument values
   *
   * @example "transfer(0x742d...f251e, 1000000000000000000)"
   */
  export function formatAbiItemWithArgs(item: Item, args: readonly unknown[]): string {
    if (!("name" in item) || !("inputs" in item)) {
      return formatAbiItem(item);
    }

    const formattedArgs = args
      .map((arg, i) => {
        const param = item.inputs[i];
        // TODO: Format based on type (addresses with checksum, bigints as strings, etc.)
        return String(arg);
      })
      .join(", ");

    return `${item.name}(${formattedArgs})`;
  }

  /**
   * Get function selector from signature string
   *
   * @param signature - Function signature (e.g., "transfer(address,uint256)")
   * @returns 4-byte selector
   *
   * @example
   * ```typescript
   * const selector = Abi.getFunctionSelector("transfer(address,uint256)");
   * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
   * ```
   */
  export function getFunctionSelector(signature: string): Uint8Array {
    const hash = Hash.keccak256String(signature);
    return hash.slice(0, 4);
  }

  /**
   * Get event selector from signature string
   *
   * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
   * @returns 32-byte selector (topic0)
   *
   * @example
   * ```typescript
   * const selector = Abi.getEventSelector("Transfer(address,address,uint256)");
   * // 32-byte Hash
   * ```
   */
  export function getEventSelector(signature: string): Hash {
    return Hash.keccak256String(signature);
  }

  /**
   * Get error selector from signature string
   *
   * @param signature - Error signature (e.g., "InsufficientBalance(uint256,uint256)")
   * @returns 4-byte selector
   *
   * @example
   * ```typescript
   * const selector = Abi.getErrorSelector("InsufficientBalance(uint256,uint256)");
   * // Uint8Array([...])
   * ```
   */
  export function getErrorSelector(signature: string): Uint8Array {
    const hash = Hash.keccak256String(signature);
    return hash.slice(0, 4);
  }
}

/**
 * Complete ABI (array of items)
 *
 * Uses TypeScript declaration merging - Abi is both a namespace and a type.
 */
export type Abi = readonly Abi.Item[];

// Re-export namespace as default
export default Abi;
