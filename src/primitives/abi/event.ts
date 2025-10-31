/**
 * ABI Event Operations
 *
 * Functions for working with Ethereum event encoding and decoding
 */

import type { Event, Parameter, ParametersToPrimitiveTypes, ParametersToObject } from "./types.js";
import { AbiEncodingError, AbiDecodingError, AbiInvalidSelectorError } from "./errors.js";
import { encodeParameters, decodeParameters, encodeValue, decodeValue, isDynamicType } from "./encoding.js";
import { Hash } from "../hash.js";

/**
 * Get event selector (32 bytes, topic0)
 *
 * @throws {AbiEncodingError} If selector computation fails
 *
 * @example
 * ```typescript
 * const event: Event = { type: 'event', name: 'Transfer', ... };
 * const selector = getSelector(event);
 * ```
 */
export function getSelector<T extends Event>(event: T): Hash {
  const signature = getSignature(event);
  return Hash.keccak256String(signature);
}

/**
 * Get event signature (e.g., "Transfer(address,address,uint256)")
 *
 * @example
 * ```typescript
 * const event: Event = { type: 'event', name: 'Transfer', ... };
 * const sig = getSignature(event);
 * ```
 */
export function getSignature<T extends Event>(event: T): string {
  const inputs = event.inputs.map((p) => p.type).join(",");
  return `${event.name}(${inputs})`;
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
 * const event: Event = { type: 'event', name: 'Transfer', ... };
 * const topics = encodeTopics(event, { from, to });
 * ```
 */
export function encodeTopics<T extends Event>(
  event: T,
  args: Partial<ParametersToObject<T["inputs"]>>,
): (Hash | null)[] {
  const topics: (Hash | null)[] = [];

  // topic0: event selector (unless anonymous)
  if (!event.anonymous) {
    topics.push(getSelector(event));
  }

  // Encode indexed parameters
  for (const param of event.inputs) {
    if (!param.indexed) continue;

    const value = param.name ? (args as any)[param.name] : undefined;
    if (value === undefined || value === null) {
      topics.push(null);
      continue;
    }

    // For dynamic types (string, bytes, arrays), hash the value
    if (isDynamicType(param.type)) {
      const { encoded } = encodeValue(param.type, value);
      topics.push(Hash.keccak256(encoded));
    } else {
      // For static types, encode normally
      const { encoded } = encodeValue(param.type, value);
      topics.push(encoded as Hash);
    }
  }

  return topics;
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
 * const event: Event = { type: 'event', name: 'Transfer', ... };
 * const decoded = decodeLog(event, data, topics);
 * ```
 */
export function decodeLog<T extends Event>(
  event: T,
  data: Uint8Array,
  topics: readonly Hash[],
): ParametersToObject<T["inputs"]> {
  let topicIndex = 0;

  // Verify topic0 (selector) if not anonymous
  if (!event.anonymous) {
    if (topics.length === 0) {
      throw new AbiDecodingError("Missing topic0 for non-anonymous event");
    }
    const topic0 = topics[0];
    if (!topic0) {
      throw new AbiDecodingError("Missing topic0 for non-anonymous event");
    }
    const expectedSelector = getSelector(event);
    // Check selector match
    for (let i = 0; i < 32; i++) {
      const t0Byte = topic0[i];
      const expByte = expectedSelector[i];
      if (t0Byte !== expByte) {
        throw new AbiInvalidSelectorError("Event selector mismatch");
      }
    }
    topicIndex = 1;
  }

  const result: any = {};
  const nonIndexedParams: Parameter[] = [];

  // Decode indexed parameters from topics
  for (const param of event.inputs) {
    if (param.indexed) {
      if (topicIndex >= topics.length) {
        throw new AbiDecodingError(`Missing topic for indexed parameter ${param.name}`);
      }
      const topic = topics[topicIndex++];

      // For dynamic types, we can't decode (only have hash)
      if (isDynamicType(param.type)) {
        // Store the hash itself
        if (param.name) {
          result[param.name] = topic;
        }
      } else {
        // Decode static types
        const { value } = decodeValue(param.type, topic as Uint8Array, 0);
        if (param.name) {
          result[param.name] = value;
        }
      }
    } else {
      nonIndexedParams.push(param);
    }
  }

  // Decode non-indexed parameters from data
  if (nonIndexedParams.length > 0) {
    const decoded = decodeParameters(nonIndexedParams as any, data);
    for (let i = 0; i < nonIndexedParams.length; i++) {
      const param = nonIndexedParams[i];
      if (param && param.name) {
        result[param.name] = (decoded as any)[i];
      }
    }
  }

  return result as any;
}
