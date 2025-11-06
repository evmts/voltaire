import type { BrandedConstructor } from "../../constructor/BrandedConstructor/BrandedConstructor.js";
import type { BrandedError } from "../../error/BrandedError/BrandedError.js";
import type { Event } from "../../event/BrandedEvent/BrandedEvent.js";
import type { Function } from "../../function/BrandedFunction/BrandedFunction.js";
import type { StateMutability } from "../../function/statemutability.js";

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

/**
 * Branded ABI Item - discriminated union of all ABI item types
 */
export type BrandedItem =
	| Function
	| Event
	| BrandedError
	| BrandedConstructor
	| Fallback
	| Receive;
