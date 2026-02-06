import type { ConstructorType } from "../constructor/ConstructorType.js";
import type { ErrorType } from "../error/ErrorType.js";
import type { EventType } from "../event/EventType.js";
import type { FunctionType as AbiFunction } from "../function/FunctionType.js";
import type { StateMutability } from "../function/statemutability.js";
export type Fallback<TStateMutability extends StateMutability = StateMutability> = {
    type: "fallback";
    stateMutability: TStateMutability;
};
export type Receive = {
    type: "receive";
    stateMutability: "payable";
};
/**
 * ItemType - discriminated union of all ABI item types
 */
export type ItemType = AbiFunction | EventType | ErrorType | ConstructorType | Fallback | Receive;
//# sourceMappingURL=ItemType.d.ts.map