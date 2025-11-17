import type { HashType } from "../../Hash/index.js";
import type {
	DecodeLogResult,
	EncodeTopicsArgs,
	EventType,
} from "./EventType.js";

export interface EventConstructor {
	getSignature<T extends EventType>(event: T): string;
	getSelector<T extends EventType>(event: T): HashType;
	encodeTopics<T extends EventType>(
		event: T,
		args: EncodeTopicsArgs<T["inputs"]>,
	): (HashType | null)[];
	decodeLog<T extends EventType>(
		event: T,
		data: Uint8Array,
		topics: readonly HashType[],
	): DecodeLogResult<T["inputs"]>;
}
