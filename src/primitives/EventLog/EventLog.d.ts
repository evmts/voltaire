import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/BrandedHash/BrandedHash.js";
import type { BrandedHex } from "../Hex/BrandedHex/BrandedHex.js";
import type { BrandedEventLog } from "./BrandedEventLog/index.js";

export interface EventLogParams {
	address: BrandedAddress;
	topics: readonly (BrandedHash | null | undefined)[];
	data: BrandedHex;
	blockNumber?: bigint;
	blockHash?: BrandedHash;
	transactionHash?: BrandedHash;
	transactionIndex?: number;
	logIndex?: number;
	removed?: boolean;
}

export function EventLog(params: EventLogParams): BrandedEventLog;
export namespace EventLog {
	export function from(params: EventLogParams): BrandedEventLog;
	export function create(params: EventLogParams): BrandedEventLog;
	export function clone(log: BrandedEventLog): BrandedEventLog;
	export function copy(log: BrandedEventLog): BrandedEventLog;
	export function getIndexed(
		log: BrandedEventLog,
	): readonly (BrandedHash | null)[];
	export function getIndexedTopics(
		log: BrandedEventLog,
	): readonly BrandedHash[];
	export function getSignature(log: BrandedEventLog): BrandedHash | null;
	export function getTopic0(log: BrandedEventLog): BrandedHash | null;
	export function isRemoved(log: BrandedEventLog): boolean;
	export function wasRemoved(log: BrandedEventLog): boolean;
	export function matchesAddress(
		log: BrandedEventLog,
		address: BrandedAddress | BrandedAddress[],
	): boolean;
	export function matchesTopics(
		log: BrandedEventLog,
		topics: readonly (BrandedHash | BrandedHash[] | null)[],
	): boolean;
	export function matchesFilter(
		log: BrandedEventLog,
		filter: {
			address?: BrandedAddress | BrandedAddress[];
			topics?: readonly (BrandedHash | BrandedHash[] | null)[];
		},
	): boolean;
	export function filterLogs(
		logs: readonly BrandedEventLog[],
		filter: {
			address?: BrandedAddress | BrandedAddress[];
			topics?: readonly (BrandedHash | BrandedHash[] | null)[];
		},
	): BrandedEventLog[];
	export function sortLogs(logs: readonly BrandedEventLog[]): BrandedEventLog[];
}

export type { BrandedEventLog } from "./BrandedEventLog/index.js";
