import type { HashType } from "../../Hash/index.js";
import type {
	DecodeLogResult,
	EncodeTopicsArgs,
	Event,
} from "./BrandedEvent/BrandedEvent.js";

export interface EventConstructor {
	getSignature<T extends Event>(event: T): string;
	getSelector<T extends Event>(event: T): HashType;
	encodeTopics<T extends Event>(
		event: T,
		args: EncodeTopicsArgs<T["inputs"]>,
	): (HashType | null)[];
	decodeLog<T extends Event>(
		event: T,
		data: Uint8Array,
		topics: readonly HashType[],
	): DecodeLogResult<T["inputs"]>;
}
