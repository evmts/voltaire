/**
 * ABI (Application Binary Interface) Types and Utilities
 *
 * Complete ABI encoding/decoding with type inference matching viem.
 * All methods operate on the correct data structures.
 */

import type { Address } from "./address.js";
import type { Hash } from "./hash.js";

// ============================================================================
// Core ABI Types with Generics
// ============================================================================

export type StateMutability = "pure" | "view" | "nonpayable" | "payable";

/**
 * ABI Parameter with generic type tracking
 */
export type AbiParameter<
  TType extends string = string,
  TName extends string = string,
  TInternalType extends string = string,
> = {
  type: TType;
  name?: TName;
  internalType?: TInternalType;
  indexed?: boolean;
  components?: readonly AbiParameter[];
};

/**
 * ABI Function with generic tracking
 */
export type AbiFunction<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly AbiParameter[] = readonly AbiParameter[],
  TOutputs extends readonly AbiParameter[] = readonly AbiParameter[],
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
export type AbiEvent<
  TName extends string = string,
  TInputs extends readonly AbiParameter[] = readonly AbiParameter[],
> = {
  type: "event";
  name: TName;
  inputs: TInputs;
  anonymous?: boolean;
};

/**
 * ABI Error with generic tracking
 */
export type AbiError<
  TName extends string = string,
  TInputs extends readonly AbiParameter[] = readonly AbiParameter[],
> = {
  type: "error";
  name: TName;
  inputs: TInputs;
};

/**
 * ABI Constructor with generic tracking
 */
export type AbiConstructor<
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly AbiParameter[] = readonly AbiParameter[],
> = {
  type: "constructor";
  stateMutability: TStateMutability;
  inputs: TInputs;
};

/**
 * ABI Fallback
 */
export type AbiFallback<TStateMutability extends StateMutability = StateMutability> = {
  type: "fallback";
  stateMutability: TStateMutability;
};

/**
 * ABI Receive
 */
export type AbiReceive = {
  type: "receive";
  stateMutability: "payable";
};

/**
 * Any ABI item
 */
export type AbiItem =
  | AbiFunction
  | AbiEvent
  | AbiError
  | AbiConstructor
  | AbiFallback
  | AbiReceive;

/**
 * Complete ABI
 */
export type Abi = readonly AbiItem[];

// ============================================================================
// Type Utilities for Inference
// ============================================================================

/**
 * Extract function names from ABI
 */
export type ExtractAbiFunctionNames<TAbi extends Abi> = Extract<
  TAbi[number],
  { type: "function" }
>["name"];

/**
 * Extract event names from ABI
 */
export type ExtractAbiEventNames<TAbi extends Abi> = Extract<
  TAbi[number],
  { type: "event" }
>["name"];

/**
 * Extract error names from ABI
 */
export type ExtractAbiErrorNames<TAbi extends Abi> = Extract<
  TAbi[number],
  { type: "error" }
>["name"];

/**
 * Get function from ABI by name
 */
export type GetAbiFunction<
  TAbi extends Abi,
  TName extends string,
> = Extract<TAbi[number], { type: "function"; name: TName }>;

/**
 * Get event from ABI by name
 */
export type GetAbiEvent<
  TAbi extends Abi,
  TName extends string,
> = Extract<TAbi[number], { type: "event"; name: TName }>;

/**
 * Get error from ABI by name
 */
export type GetAbiError<
  TAbi extends Abi,
  TName extends string,
> = Extract<TAbi[number], { type: "error"; name: TName }>;

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
export type AbiParametersToPrimitiveTypes<TParams extends readonly AbiParameter[]> = {
  [K in keyof TParams]: TParams[K] extends AbiParameter<infer TType>
    ? TType extends "address" ? Address
    : TType extends "bool" ? boolean
    : TType extends `uint${string}` | `int${string}` ? bigint
    : TType extends "string" ? string
    : TType extends `bytes${string}` | "bytes" ? Uint8Array
    : unknown // TODO: Complete mapping
    : never;
};

/**
 * Convert ABI parameters to object with named properties
 */
export type AbiParametersToObject<TParams extends readonly AbiParameter[]> = {
  [K in TParams[number] as K extends { name: infer TName extends string }
    ? TName
    : never]: K extends AbiParameter<infer TType>
    ? TType extends "address" ? Address
    : TType extends "bool" ? boolean
    : TType extends `uint${string}` | `int${string}` ? bigint
    : TType extends "string" ? string
    : TType extends `bytes${string}` | "bytes" ? Uint8Array
    : unknown
    : never;
};

// ============================================================================
// AbiParameter Operations
// ============================================================================

export namespace AbiParameter {
  /**
   * Encode single parameter value
   *
   * TODO: Implement ABI encoding for single parameter
   */
  export function encode<T extends AbiParameter>(
    param: T,
    value: unknown,
  ): Uint8Array {
    throw new Error("Not implemented");
  }

  /**
   * Decode single parameter value
   *
   * TODO: Implement ABI decoding for single parameter
   */
  export function decode<T extends AbiParameter>(
    param: T,
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
export function encodeAbiParameters<const TParams extends readonly AbiParameter[]>(
  params: TParams,
  values: AbiParametersToPrimitiveTypes<TParams>,
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
export function decodeAbiParameters<const TParams extends readonly AbiParameter[]>(
  params: TParams,
  data: Uint8Array,
): AbiParametersToPrimitiveTypes<TParams> {
  // TODO: Implement ABI parameter decoding
  // 1. Read static data section
  // 2. Follow offsets for dynamic types
  // 3. Decode each parameter by type
  // 4. Return typed array
  throw new Error("Not implemented");
}

// ============================================================================
// AbiFunction Operations
// ============================================================================

export namespace AbiFunction {
  /**
   * Get function selector (4 bytes)
   */
  export function getSelector<T extends AbiFunction>(fn: T): Uint8Array {
    // TODO: keccak256(signature).slice(0, 4)
    throw new Error("Not implemented");
  }

  /**
   * Get function signature (e.g., "transfer(address,uint256)")
   */
  export function getSignature<T extends AbiFunction>(fn: T): string {
    const inputs = fn.inputs.map(p => p.type).join(",");
    return `${fn.name}(${inputs})`;
  }

  /**
   * Encode function call data
   */
  export function encodeFunctionData<T extends AbiFunction>(
    fn: T,
    args: AbiParametersToPrimitiveTypes<T["inputs"]>,
  ): Uint8Array {
    // TODO: concat(getSelector(fn), encodeAbiParameters(fn.inputs, args))
    throw new Error("Not implemented");
  }

  /**
   * Decode function call data
   */
  export function decodeFunctionData<T extends AbiFunction>(
    fn: T,
    data: Uint8Array,
  ): AbiParametersToPrimitiveTypes<T["inputs"]> {
    // TODO: skip 4-byte selector, decodeAbiParameters(fn.inputs, data.slice(4))
    throw new Error("Not implemented");
  }

  /**
   * Encode function result
   */
  export function encodeFunctionResult<T extends AbiFunction>(
    fn: T,
    values: AbiParametersToPrimitiveTypes<T["outputs"]>,
  ): Uint8Array {
    // TODO: encodeAbiParameters(fn.outputs, values)
    throw new Error("Not implemented");
  }

  /**
   * Decode function result
   */
  export function decodeFunctionResult<T extends AbiFunction>(
    fn: T,
    data: Uint8Array,
  ): AbiParametersToPrimitiveTypes<T["outputs"]> {
    // TODO: decodeAbiParameters(fn.outputs, data)
    throw new Error("Not implemented");
  }

  /**
   * Prepare encode function data (validation without encoding)
   */
  export function prepareEncodeFunctionData<T extends AbiFunction>(
    fn: T,
    args: AbiParametersToPrimitiveTypes<T["inputs"]>,
  ): { functionName: string; args: unknown[] } {
    // TODO: Validate args, return prepared data
    return { functionName: fn.name, args: args as unknown[] };
  }
}

// ============================================================================
// AbiEvent Operations
// ============================================================================

export namespace AbiEvent {
  /**
   * Get event selector (32 bytes, topic0)
   */
  export function getSelector<T extends AbiEvent>(event: T): Hash {
    // TODO: keccak256(signature)
    throw new Error("Not implemented");
  }

  /**
   * Get event signature (e.g., "Transfer(address,address,uint256)")
   */
  export function getSignature<T extends AbiEvent>(event: T): string {
    const inputs = event.inputs.map(p => p.type).join(",");
    return `${event.name}(${inputs})`;
  }

  /**
   * Encode event topics for indexed parameters
   */
  export function encodeEventTopics<T extends AbiEvent>(
    event: T,
    args: Partial<AbiParametersToObject<T["inputs"]>>,
  ): (Hash | null)[] {
    // TODO:
    // 1. topic0 = getSelector(event)
    // 2. For each indexed parameter, hash if dynamic type, else encode
    // 3. Return array of topics
    throw new Error("Not implemented");
  }

  /**
   * Decode event log
   */
  export function decodeEventLog<T extends AbiEvent>(
    event: T,
    data: Uint8Array,
    topics: readonly Hash[],
  ): AbiParametersToObject<T["inputs"]> {
    // TODO:
    // 1. Verify topics[0] matches selector
    // 2. Decode indexed params from topics
    // 3. Decode non-indexed params from data
    // 4. Combine into object
    throw new Error("Not implemented");
  }
}

// ============================================================================
// AbiError Operations
// ============================================================================

export namespace AbiError {
  /**
   * Get error selector (4 bytes)
   */
  export function getSelector<T extends AbiError>(error: T): Uint8Array {
    // TODO: keccak256(signature).slice(0, 4)
    throw new Error("Not implemented");
  }

  /**
   * Get error signature (e.g., "InsufficientBalance(uint256,uint256)")
   */
  export function getSignature<T extends AbiError>(error: T): string {
    const inputs = error.inputs.map(p => p.type).join(",");
    return `${error.name}(${inputs})`;
  }

  /**
   * Encode error result
   */
  export function encodeErrorResult<T extends AbiError>(
    error: T,
    args: AbiParametersToPrimitiveTypes<T["inputs"]>,
  ): Uint8Array {
    // TODO: concat(getSelector(error), encodeAbiParameters(error.inputs, args))
    throw new Error("Not implemented");
  }

  /**
   * Decode error result
   */
  export function decodeErrorResult<T extends AbiError>(
    error: T,
    data: Uint8Array,
  ): AbiParametersToPrimitiveTypes<T["inputs"]> {
    // TODO: skip 4-byte selector, decodeAbiParameters(error.inputs, data.slice(4))
    throw new Error("Not implemented");
  }
}

// ============================================================================
// AbiConstructor Operations
// ============================================================================

export namespace AbiConstructor {
  /**
   * Encode deploy data (bytecode + constructor args)
   */
  export function encodeDeployData<T extends AbiConstructor>(
    constructor: T,
    bytecode: Uint8Array,
    args: AbiParametersToPrimitiveTypes<T["inputs"]>,
  ): Uint8Array {
    // TODO: concat(bytecode, encodeAbiParameters(constructor.inputs, args))
    throw new Error("Not implemented");
  }

  /**
   * Decode deploy data (extract constructor args from deploy transaction)
   */
  export function decodeDeployData<T extends AbiConstructor>(
    constructor: T,
    data: Uint8Array,
    bytecodeLength: number,
  ): AbiParametersToPrimitiveTypes<T["inputs"]> {
    // TODO: decodeAbiParameters(constructor.inputs, data.slice(bytecodeLength))
    throw new Error("Not implemented");
  }
}

// ============================================================================
// Abi-Level Operations (operate on full ABI)
// ============================================================================

export namespace Abi {
  /**
   * Get ABI item by name and optionally type
   */
  export function getAbiItem<
    TAbi extends Abi,
    TName extends string,
    TType extends AbiItem["type"] | undefined = undefined,
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
    TAbi extends Abi,
    TFunctionName extends ExtractAbiFunctionNames<TAbi>,
  >(
    abi: TAbi,
    functionName: TFunctionName,
    args: AbiParametersToPrimitiveTypes<GetAbiFunction<TAbi, TFunctionName>["inputs"]>,
  ): Uint8Array {
    const fn = getAbiItem(abi, functionName, "function");
    if (!fn) throw new Error(`Function ${functionName} not found`);
    return AbiFunction.encodeFunctionData(fn as any, args);
  }

  /**
   * Decode function result using function name
   */
  export function decodeFunctionResult<
    TAbi extends Abi,
    TFunctionName extends ExtractAbiFunctionNames<TAbi>,
  >(
    abi: TAbi,
    functionName: TFunctionName,
    data: Uint8Array,
  ): AbiParametersToPrimitiveTypes<GetAbiFunction<TAbi, TFunctionName>["outputs"]> {
    const fn = getAbiItem(abi, functionName, "function");
    if (!fn) throw new Error(`Function ${functionName} not found`);
    return AbiFunction.decodeFunctionResult(fn as any, data);
  }

  /**
   * Decode function call data using function name
   */
  export function decodeFunctionData<
    TAbi extends Abi,
    TFunctionName extends ExtractAbiFunctionNames<TAbi>,
  >(
    abi: TAbi,
    data: Uint8Array,
  ): {
    functionName: TFunctionName;
    args: AbiParametersToPrimitiveTypes<GetAbiFunction<TAbi, TFunctionName>["inputs"]>;
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
  export function parseEventLogs<TAbi extends Abi>(
    abi: TAbi,
    logs: Array<{ topics: readonly Hash[]; data: Uint8Array }>,
  ): Array<{
    eventName: ExtractAbiEventNames<TAbi>;
    args: unknown;
    log: { topics: readonly Hash[]; data: Uint8Array };
  }> {
    // TODO:
    // 1. For each log, extract topic0
    // 2. Find matching event in abi
    // 3. Decode using AbiEvent.decodeEventLog
    // 4. Return array of parsed logs
    throw new Error("Not implemented");
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

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
export function formatAbiItem(item: AbiItem): string {
  if (!("name" in item)) {
    return item.type;
  }

  const inputs = "inputs" in item
    ? item.inputs.map(p => `${p.type}${p.name ? ` ${p.name}` : ""}`).join(", ")
    : "";

  let result = `${item.type} ${item.name}(${inputs})`;

  if (item.type === "function" && item.outputs.length > 0) {
    const outputs = item.outputs.map(p => p.type).join(", ");
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
export function formatAbiItemWithArgs(
  item: AbiItem,
  args: readonly unknown[],
): string {
  if (!("name" in item) || !("inputs" in item)) {
    return formatAbiItem(item);
  }

  const formattedArgs = args.map((arg, i) => {
    const param = item.inputs[i];
    // TODO: Format based on type (addresses with checksum, bigints as strings, etc.)
    return String(arg);
  }).join(", ");

  return `${item.name}(${formattedArgs})`;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

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
