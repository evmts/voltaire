import type { Parameter, ParametersToObject } from "../Parameter.js";
import type { Item } from "../Item.js";
import { AbiDecodingError, AbiInvalidSelectorError } from "../Errors.js";
import { decodeParameters, encodeValue, decodeValue, isDynamicType } from "../Encoding.js";
import type { Hash as HashType } from "../../Hash/index.js";
import * as Hash from "../../Hash/index.js";

export type Event<
  TName extends string = string,
  TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
  type: "event";
  name: TName;
  inputs: TInputs;
  anonymous?: boolean;
};

export function getSelector<
  TName extends string = string,
  TInputs extends readonly Parameter[] = readonly Parameter[],
>(this: Event<TName, TInputs>): Hash {
  const signature = getSignature.call(this);
  return Hash.keccak256String(signature);
}

export function getSignature<
  TName extends string = string,
  TInputs extends readonly Parameter[] = readonly Parameter[],
>(this: Event<TName, TInputs>): string {
  const inputs = this.inputs.map((p) => p.type).join(",");
  return `${this.name}(${inputs})`;
}

export function encodeTopics<
  TName extends string = string,
  TInputs extends readonly Parameter[] = readonly Parameter[],
>(
  this: Event<TName, TInputs>,
  args: Partial<ParametersToObject<TInputs>>,
): (Hash | null)[] {
  const topics: (Hash | null)[] = [];

  if (!this.anonymous) {
    topics.push(getSelector.call(this));
  }

  for (const param of this.inputs) {
    if (!param.indexed) continue;

    const value = param.name ? (args as any)[param.name] : undefined;
    if (value === undefined || value === null) {
      topics.push(null);
      continue;
    }

    if (isDynamicType(param.type)) {
      const { encoded } = encodeValue(param.type, value);
      topics.push(Hash.keccak256(encoded));
    } else {
      const { encoded } = encodeValue(param.type, value);
      topics.push(encoded as Hash);
    }
  }

  return topics;
}

export function decodeLog<
  TName extends string = string,
  TInputs extends readonly Parameter[] = readonly Parameter[],
>(
  this: Event<TName, TInputs>,
  data: Uint8Array,
  topics: readonly Hash[],
): ParametersToObject<TInputs> {
  let topicIndex = 0;

  if (!this.anonymous) {
    if (topics.length === 0) {
      throw new AbiDecodingError("Missing topic0 for non-anonymous event");
    }
    const topic0 = topics[0];
    if (!topic0) {
      throw new AbiDecodingError("Missing topic0 for non-anonymous event");
    }
    const expectedSelector = getSelector.call(this);
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

  for (const param of this.inputs) {
    if (param.indexed) {
      if (topicIndex >= topics.length) {
        throw new AbiDecodingError(`Missing topic for indexed parameter ${param.name}`);
      }
      const topic = topics[topicIndex++];

      if (isDynamicType(param.type)) {
        if (param.name) {
          result[param.name] = topic;
        }
      } else {
        const { value } = decodeValue(param.type, topic as Uint8Array, 0);
        if (param.name) {
          result[param.name] = value;
        }
      }
    } else {
      nonIndexedParams.push(param);
    }
  }

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

export type ExtractNames<TAbi extends readonly Item[]> = Extract<
  TAbi[number],
  { type: "event" }
>["name"];

export type Get<TAbi extends readonly Item[], TName extends string> = Extract<
  TAbi[number],
  { type: "event"; name: TName }
>;

