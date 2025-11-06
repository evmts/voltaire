import type { BrandedHash } from "../../Hash/index.js";
import type {
	DecodeLogResult,
	EncodeTopicsArgs,
	Event,
} from "./BrandedEvent/BrandedEvent.js";

export interface EventConstructor {
	getSignature<T extends Event>(event: T): string;
	getSelector<T extends Event>(event: T): BrandedHash;
	encodeTopics<T extends Event>(
		event: T,
		args: EncodeTopicsArgs<T["inputs"]>,
	): (BrandedHash | null)[];
	decodeLog<T extends Event>(
		event: T,
		data: Uint8Array,
		topics: readonly BrandedHash[],
	): DecodeLogResult<T["inputs"]>;
}
