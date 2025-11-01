import type { Function } from "./function/function.js";
import type { Event } from "./event/event.js";
import type { Error } from "./error/error.js";
import type { Constructor } from "./constructor/constructor.js";
import type { StateMutability } from "./function/statemutability.js";

export type Fallback<TStateMutability extends StateMutability = StateMutability> = {
  type: "fallback";
  stateMutability: TStateMutability;
};

export type Receive = {
  type: "receive";
  stateMutability: "payable";
};

export type Item = Function | Event | Error | Constructor | Fallback | Receive;

export function format(this: Item): string {
  if (!("name" in this)) {
    return this.type;
  }

  const inputs =
    "inputs" in this
      ? this.inputs.map((p) => `${p.type}${p.name ? ` ${p.name}` : ""}`).join(", ")
      : "";

  let result = `${this.type} ${this.name}(${inputs})`;

  if (this.type === "function" && this.outputs.length > 0) {
    const outputs = this.outputs.map((p) => p.type).join(", ");
    result += ` returns (${outputs})`;
  }

  if ("stateMutability" in this && this.stateMutability !== "nonpayable") {
    result += ` ${this.stateMutability}`;
  }

  return result;
}

export function formatWithArgs(this: Item, args: readonly unknown[]): string {
  if (!("name" in this) || !("inputs" in this)) {
    return format.call(this);
  }

  const formattedArgs = args
    .map((arg, i) => {
      void this.inputs[i];
      return String(arg);
    })
    .join(", ");

  return `${this.name}(${formattedArgs})`;
}

export function getItem<
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
