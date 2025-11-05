import type { BrandedConstructor as Constructor } from "./constructor/BrandedConstructor.js";
import type { BrandedError as Error } from "./error/BrandedError.js";
import type { Event } from "./event/BrandedEvent.js";
import type { Function } from "./function/BrandedFunction.js";
import type { StateMutability } from "./function/statemutability.js";

export type Fallback<
	TStateMutability extends StateMutability = StateMutability,
> = {
	type: "fallback";
	stateMutability: TStateMutability;
};

export type Receive = {
	type: "receive";
	stateMutability: "payable";
};

export type Item = Function | Event | Error | Constructor | Fallback | Receive;

export function format(item: Item): string {
	if (!("name" in item)) {
		return item.type;
	}

	const inputs =
		"inputs" in item
			? item.inputs
					.map((p: { type: string; name?: string }) => `${p.type}${p.name ? ` ${p.name}` : ""}`)
					.join(", ")
			: "";

	let result = `${item.type} ${item.name}(${inputs})`;

	if (item.type === "function" && item.outputs.length > 0) {
		const outputs = item.outputs.map((p: { type: string }) => p.type).join(", ");
		result += ` returns (${outputs})`;
	}

	if ("stateMutability" in item && item.stateMutability !== "nonpayable") {
		result += ` ${item.stateMutability}`;
	}

	return result;
}

export function formatWithArgs(item: Item, args: readonly unknown[]): string {
	if (!("name" in item) || !("inputs" in item)) {
		return format(item);
	}

	const formattedArgs = args
		.map((arg, i) => {
			void item.inputs[i];
			return String(arg);
		})
		.join(", ");

	return `${item.name}(${formattedArgs})`;
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
