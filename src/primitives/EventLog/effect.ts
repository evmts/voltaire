import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

import { toBytes as hexToBytes } from "../Hex/toBytes.js";
import type { EventLogType } from "./EventLogType.js";
import { create as _create } from "./create.js";
import { filterLogs as _filterLogs } from "./filterLogs.js";
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
import { matchesFilter as _matchesFilter } from "./matchesFilter.js";

const isHash32 = (b: unknown): b is Uint8Array =>
	b instanceof Uint8Array && b.length === 32;
const isAddr20 = (b: unknown): b is Uint8Array =>
	b instanceof Uint8Array && b.length === 20;

export type EventLogBrand = EventLogType & Brand.Brand<"EventLog">;

export const EventLogBrand = Brand.refined<EventLogBrand>(
	(x): x is EventLogBrand =>
		typeof x === "object" &&
		x !== null &&
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		isAddr20((x as any).address) &&
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		Array.isArray((x as any).topics) &&
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		(x as any).topics.every(isHash32) &&
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		(x as any).data instanceof Uint8Array,
	() => Brand.error("Invalid EventLog: failed structural validation"),
);

export class EventLogSchema extends Schema.Class<EventLogSchema>("EventLog")({
	address: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter(isAddr20, { message: () => "address must be 20 bytes" }),
	),
	topics: Schema.Array(
		Schema.Uint8ArrayFromSelf.pipe(
			Schema.filter(isHash32, { message: () => "topic must be 32 bytes" }),
		),
	),
	data: Schema.Uint8ArrayFromSelf,
	blockNumber: Schema.optional(Schema.BigIntFromSelf),
	transactionHash: Schema.optional(
		Schema.Uint8ArrayFromSelf.pipe(
			Schema.filter(isHash32, { message: () => "tx hash must be 32 bytes" }),
		),
	),
	transactionIndex: Schema.optional(Schema.Number),
	blockHash: Schema.optional(
		Schema.Uint8ArrayFromSelf.pipe(
			Schema.filter(isHash32, { message: () => "block hash must be 32 bytes" }),
		),
	),
	logIndex: Schema.optional(Schema.Number),
	removed: Schema.optional(Schema.Boolean),
}) {
	get eventLog(): EventLogType {
		const {
			address,
			topics,
			data,
			blockNumber,
			transactionHash,
			transactionIndex,
			blockHash,
			logIndex,
			removed,
		} = this;
		return _create({
			address,
			topics,
			data,
			blockNumber,
			transactionHash,
			transactionIndex,
			blockHash,
			logIndex,
			removed: removed ?? false,
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		} as any) as EventLogType;
	}

	get branded(): EventLogBrand {
		return this.eventLog as EventLogBrand;
	}

	static fromBranded(log: EventLogBrand): EventLogSchema {
		const addr =
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			typeof (log as any).address === "string"
				? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					hexToBytes((log as any).address as any)
				: // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					(log as any).address;
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		const topics = (log.topics as any[]).map((t) =>
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			typeof t === "string" ? hexToBytes(t as any) : t,
		);
		const data =
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			typeof (log as any).data === "string"
				? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					hexToBytes((log as any).data as any)
				: // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					(log as any).data;
		const txHash =
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			typeof (log as any).transactionHash === "string"
				? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					hexToBytes((log as any).transactionHash as any)
				: // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					(log as any).transactionHash;
		const blockHash =
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			typeof (log as any).blockHash === "string"
				? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					hexToBytes((log as any).blockHash as any)
				: // biome-ignore lint/suspicious/noExplicitAny: type coercion required
					(log as any).blockHash;
		return new EventLogSchema({
			address: addr as Uint8Array,
			topics: topics as Uint8Array[],
			data: data as Uint8Array,
			blockNumber: log.blockNumber,
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			transactionHash: txHash as any,
			transactionIndex: log.transactionIndex,
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			blockHash: blockHash as any,
			logIndex: log.logIndex,
			removed: log.removed,
		});
	}

	static from(params: Parameters<typeof _create>[0]): EventLogSchema {
		const log = _create(params);
		return EventLogSchema.fromBranded(log as EventLogBrand);
	}

	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	static fromRpc(rpc: any): EventLogSchema {
		const log = _fromRpc(rpc);
		return EventLogSchema.fromBranded(log as EventLogBrand);
	}

	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	matches(filter: any): boolean {
		return _matchesFilter(this.eventLog, filter);
	}

	static filter(
		logs: readonly EventLogSchema[],
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		filter: any,
	): EventLogSchema[] {
		const branded = logs.map((l) => l.eventLog);
		const out = _filterLogs(branded, filter);
		return out.map((b) => EventLogSchema.fromBranded(b as EventLogBrand));
	}
}
