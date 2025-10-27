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
import type { Hash } from "./hash.js";

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
   * TODO: Complete implementation with all Solidity type mappings
   * - uint/int variants -> bigint
   * - address -> Address
   * - bool -> boolean
   * - bytes/bytesN -> Uint8Array
   * - string -> string
   * - arrays -> Array<T>
   * - tuples -> readonly [T1, T2, ...]
   */
  export type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = {
    [K in keyof TParams]: TParams[K] extends Parameter<infer TType>
      ? TType extends "address"
        ? Address
        : TType extends "bool"
          ? boolean
          : TType extends `uint${string}` | `int${string}`
            ? bigint
            : TType extends "string"
              ? string
              : TType extends `bytes${string}` | "bytes"
                ? Uint8Array
                : unknown // TODO: Complete mapping
      : never;
  };

  /**
   * Convert ABI parameters to object with named properties
   */
  export type ParametersToObject<TParams extends readonly Parameter[]> = {
    [K in TParams[number] as K extends { name: infer TName extends string }
      ? TName
      : never]: K extends Parameter<infer TType>
      ? TType extends "address"
        ? Address
        : TType extends "bool"
          ? boolean
          : TType extends `uint${string}` | `int${string}`
            ? bigint
            : TType extends "string"
              ? string
              : TType extends `bytes${string}` | "bytes"
                ? Uint8Array
                : unknown
      : never;
  };

  // ==========================================================================
  // Parameter Operations
  // ==========================================================================

  export namespace Parameter {
    /**
     * Encode single parameter value
     *
     * TODO: Implement ABI encoding for single parameter
     */
    export function encode<T extends Abi.Parameter>(
      this: T,
      value: unknown,
    ): Uint8Array {
      throw new Error("Not implemented");
    }

    /**
     * Decode single parameter value
     *
     * TODO: Implement ABI decoding for single parameter
     */
    export function decode<T extends Abi.Parameter>(
      this: T,
      data: Uint8Array,
    ): unknown {
      throw new Error("Not implemented");
    }
  }

  /**
   * Encode ABI parameters
   *
   * @param params - Parameter definitions
   * @param values - Values to encode
   * @returns Encoded data
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
    throw new Error("Not implemented");
  }

  /**
   * Decode ABI parameters
   *
   * @param params - Parameter definitions
   * @param data - Encoded data
   * @returns Decoded values
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
    throw new Error("Not implemented");
  }

  // ==========================================================================
  // Function Operations
  // ==========================================================================

  export namespace Function {
    /**
     * Get function selector (4 bytes)
     */
    export function getSelector<T extends Abi.Function>(this: T): Uint8Array {
      // TODO: keccak256(signature).slice(0, 4)
      throw new Error("Not implemented");
    }

    /**
     * Get function signature (e.g., "transfer(address,uint256)")
     */
    export function getSignature<T extends Abi.Function>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode function call data
     */
    export function encodeFunctionData<T extends Abi.Function>(
      this: T,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      // TODO: concat(getSelector.call(this), encodeParameters(this.inputs, args))
      throw new Error("Not implemented");
    }

    /**
     * Decode function call data
     */
    export function decodeFunctionData<T extends Abi.Function>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      // TODO: skip 4-byte selector, decodeParameters(this.inputs, data.slice(4))
      throw new Error("Not implemented");
    }

    /**
     * Encode function result
     */
    export function encodeFunctionResult<T extends Abi.Function>(
      this: T,
      values: ParametersToPrimitiveTypes<T["outputs"]>,
    ): Uint8Array {
      // TODO: encodeParameters(this.outputs, values)
      throw new Error("Not implemented");
    }

    /**
     * Decode function result
     */
    export function decodeFunctionResult<T extends Abi.Function>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["outputs"]> {
      // TODO: decodeParameters(this.outputs, data)
      throw new Error("Not implemented");
    }

    /**
     * Prepare encode function data (validation without encoding)
     */
    export function prepareEncodeFunctionData<T extends Abi.Function>(
      this: T,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): { functionName: string; args: unknown[] } {
      // TODO: Validate args, return prepared data
      return { functionName: this.name, args: args as unknown[] };
    }
  }

  // ==========================================================================
  // Event Operations
  // ==========================================================================

  export namespace Event {
    /**
     * Get event selector (32 bytes, topic0)
     */
    export function getSelector<T extends Abi.Event>(this: T): Hash {
      // TODO: keccak256(signature)
      throw new Error("Not implemented");
    }

    /**
     * Get event signature (e.g., "Transfer(address,address,uint256)")
     */
    export function getSignature<T extends Abi.Event>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode event topics for indexed parameters
     */
    export function encodeEventTopics<T extends Abi.Event>(
      this: T,
      args: Partial<ParametersToObject<T["inputs"]>>,
    ): (Hash | null)[] {
      // TODO:
      // 1. topic0 = getSelector.call(this)
      // 2. For each indexed parameter, hash if dynamic type, else encode
      // 3. Return array of topics
      throw new Error("Not implemented");
    }

    /**
     * Decode event log
     */
    export function decodeEventLog<T extends Abi.Event>(
      this: T,
      data: Uint8Array,
      topics: readonly Hash[],
    ): ParametersToObject<T["inputs"]> {
      // TODO:
      // 1. Verify topics[0] matches selector
      // 2. Decode indexed params from topics
      // 3. Decode non-indexed params from data
      // 4. Combine into object
      throw new Error("Not implemented");
    }
  }

  // ==========================================================================
  // Error Operations
  // ==========================================================================

  export namespace Error {
    /**
     * Get error selector (4 bytes)
     */
    export function getSelector<T extends Abi.Error>(this: T): Uint8Array {
      // TODO: keccak256(signature).slice(0, 4)
      throw new Error("Not implemented");
    }

    /**
     * Get error signature (e.g., "InsufficientBalance(uint256,uint256)")
     */
    export function getSignature<T extends Abi.Error>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode error result
     */
    export function encodeErrorResult<T extends Abi.Error>(
      this: T,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      // TODO: concat(getSelector.call(this), encodeParameters(this.inputs, args))
      throw new Error("Not implemented");
    }

    /**
     * Decode error result
     */
    export function decodeErrorResult<T extends Abi.Error>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      // TODO: skip 4-byte selector, decodeParameters(this.inputs, data.slice(4))
      throw new Error("Not implemented");
    }
  }

  // ==========================================================================
  // Constructor Operations
  // ==========================================================================

  export namespace Constructor {
    /**
     * Encode deploy data (bytecode + constructor args)
     */
    export function encodeDeployData<T extends Abi.Constructor>(
      this: T,
      bytecode: Uint8Array,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      // TODO: concat(bytecode, encodeParameters(this.inputs, args))
      throw new Error("Not implemented");
    }

    /**
     * Decode deploy data (extract constructor args from deploy transaction)
     */
    export function decodeDeployData<T extends Abi.Constructor>(
      this: T,
      data: Uint8Array,
      bytecodeLength: number,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      // TODO: decodeParameters(this.inputs, data.slice(bytecodeLength))
      throw new Error("Not implemented");
    }
  }

  // ==========================================================================
  // Abi-Level Operations (operate on full ABI)
  // ==========================================================================

  /**
   * Get ABI item by name and optionally type
   */
  export function getAbiItem<
    TAbi extends readonly Item[],
    TName extends string,
    TType extends Item["type"] | undefined = undefined,
  >(
    abi: TAbi,
    name: TName,
    type?: TType,
  ): Extract<TAbi[number], { name: TName }> | undefined {
    return abi.find(
      (item) =>
        "name" in item &&
        item.name === name &&
        (type === undefined || item.type === type),
    ) as any;
  }

  /**
   * Encode function data using function name
   */
  export function encodeFunctionData<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    abi: TAbi,
    functionName: TFunctionName,
    args: ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["inputs"]>,
  ): Uint8Array {
    const fn = getAbiItem(abi, functionName, "function");
    if (!fn) throw new Error(`Function ${functionName} not found`);
    return Function.encodeFunctionData.call(fn as any, args);
  }

  /**
   * Decode function result using function name
   */
  export function decodeFunctionResult<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    abi: TAbi,
    functionName: TFunctionName,
    data: Uint8Array,
  ): ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["outputs"]> {
    const fn = getAbiItem(abi, functionName, "function");
    if (!fn) throw new Error(`Function ${functionName} not found`);
    return Function.decodeFunctionResult.call(fn as any, data);
  }

  /**
   * Decode function call data (infer function from selector)
   */
  export function decodeFunctionData<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    abi: TAbi,
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
    throw new Error("Not implemented");
  }

  /**
   * Parse event logs from array of logs
   */
  export function parseEventLogs<TAbi extends readonly Item[]>(
    abi: TAbi,
    logs: Array<{ topics: readonly Hash[]; data: Uint8Array }>,
  ): Array<{
    eventName: ExtractEventNames<TAbi>;
    args: unknown;
    log: { topics: readonly Hash[]; data: Uint8Array };
  }> {
    // TODO:
    // 1. For each log, extract topic0
    // 2. Find matching event in abi
    // 3. Decode using Event.decodeEventLog
    // 4. Return array of parsed logs
    throw new Error("Not implemented");
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
   */
  export function getFunctionSelector(signature: string): Uint8Array {
    // TODO: keccak256(signature).slice(0, 4)
    throw new Error("Not implemented");
  }

  /**
   * Get event selector from signature string
   */
  export function getEventSelector(signature: string): Hash {
    // TODO: keccak256(signature)
    throw new Error("Not implemented");
  }

  /**
   * Get error selector from signature string
   */
  export function getErrorSelector(signature: string): Uint8Array {
    // TODO: keccak256(signature).slice(0, 4)
    throw new Error("Not implemented");
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
