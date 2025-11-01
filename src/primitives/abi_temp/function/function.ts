import type { Parameter, ParametersToPrimitiveTypes } from "../Parameter.js";
import type { StateMutability } from "./statemutability.js";
import type { Item } from "../Item.js";
import { Hash } from "../../Hash/index.js";

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

export class FunctionEncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FunctionEncodingError";
  }
}

export class FunctionDecodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FunctionDecodingError";
  }
}

export class FunctionInvalidSelectorError extends Error {
  constructor(message = "Function selector mismatch") {
    super(message);
    this.name = "FunctionInvalidSelectorError";
  }
}

export function getSelector<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
  TOutputs extends readonly Parameter[] = readonly Parameter[],
>(this: Function<TName, TStateMutability, TInputs, TOutputs>): Uint8Array {
  const signature = getSignature.call(this);
  const hash = Hash.keccak256String(signature);
  return hash.slice(0, 4);
}

export function getSignature<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
  TOutputs extends readonly Parameter[] = readonly Parameter[],
>(this: Function<TName, TStateMutability, TInputs, TOutputs>): string {
  const inputs = this.inputs.map((p) => p.type).join(",");
  return `${this.name}(${inputs})`;
}

export function encodeParams<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
  TOutputs extends readonly Parameter[] = readonly Parameter[],
>(
  this: Function<TName, TStateMutability, TInputs, TOutputs>,
  args: ParametersToPrimitiveTypes<TInputs>,
): Uint8Array {
  const { encodeParameters } = require("../Encoding.js");
  const selector = getSelector.call(this);
  const encoded = encodeParameters(this.inputs, args);
  const result = new Uint8Array(selector.length + encoded.length);
  result.set(selector, 0);
  result.set(encoded, selector.length);
  return result;
}

export function decodeParams<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
  TOutputs extends readonly Parameter[] = readonly Parameter[],
>(
  this: Function<TName, TStateMutability, TInputs, TOutputs>,
  data: Uint8Array,
): ParametersToPrimitiveTypes<TInputs> {
  const { decodeParameters } = require("../Encoding.js");
  if (data.length < 4) {
    throw new FunctionDecodingError("Data too short for function selector");
  }
  const selector = data.slice(0, 4);
  const expectedSelector = getSelector.call(this);
  for (let i = 0; i < 4; i++) {
    const selByte = selector[i];
    const expByte = expectedSelector[i];
    if (selByte !== expByte) {
      throw new FunctionInvalidSelectorError();
    }
  }
  return decodeParameters(this.inputs, data.slice(4)) as any;
}

export function encodeResult<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
  TOutputs extends readonly Parameter[] = readonly Parameter[],
>(
  this: Function<TName, TStateMutability, TInputs, TOutputs>,
  values: ParametersToPrimitiveTypes<TOutputs>,
): Uint8Array {
  const { encodeParameters } = require("../Encoding.js");
  return encodeParameters(this.outputs, values);
}

export function decodeResult<
  TName extends string = string,
  TStateMutability extends StateMutability = StateMutability,
  TInputs extends readonly Parameter[] = readonly Parameter[],
  TOutputs extends readonly Parameter[] = readonly Parameter[],
>(
  this: Function<TName, TStateMutability, TInputs, TOutputs>,
  data: Uint8Array,
): ParametersToPrimitiveTypes<TOutputs> {
  const { decodeParameters } = require("../Encoding.js");
  return decodeParameters(this.outputs, data) as any;
}

export type ExtractNames<TAbi extends readonly Item[]> = Extract<
  TAbi[number],
  { type: "function" }
>["name"];

export type Get<TAbi extends readonly Item[], TName extends string> = Extract<
  TAbi[number],
  { type: "function"; name: TName }
>;

