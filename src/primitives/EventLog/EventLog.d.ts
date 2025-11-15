import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType/HashType.js";
import type { HexType } from "../Hex/HexType.js";
import type { BrandedEventLog } from "./BrandedEventLog/index.js";

export interface EventLogParams {
	address: BrandedAddress;
	topics: readonly (HashType | null | undefined)[];
	data: BrandedHex;
	blockNumber?: bigint;
	blockHash?: HashType;
	transactionHash?: HashType;
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
	): readonly (HashType | null)[];
	export function getIndexedTopics(log: BrandedEventLog): readonly HashType[];
	export function getSignature(log: BrandedEventLog): HashType | null;
	export function getTopic0(log: BrandedEventLog): HashType | null;
	export function isRemoved(log: BrandedEventLog): boolean;
	export function wasRemoved(log: BrandedEventLog): boolean;
	export function matchesAddress(
		log: BrandedEventLog,
		address: BrandedAddress | BrandedAddress[],
	): boolean;
	export function matchesTopics(
		log: BrandedEventLog,
		topics: readonly (HashType | HashType[] | null)[],
	): boolean;
	export function matchesFilter(
		log: BrandedEventLog,
		filter: {
			address?: BrandedAddress | BrandedAddress[];
			topics?: readonly (HashType | HashType[] | null)[];
		},
	): boolean;
	export function filterLogs(
		logs: readonly BrandedEventLog[],
		filter: {
			address?: BrandedAddress | BrandedAddress[];
			topics?: readonly (HashType | HashType[] | null)[];
		},
	): BrandedEventLog[];
	export function sortLogs(logs: readonly BrandedEventLog[]): BrandedEventLog[];
}

export type { BrandedEventLog } from "./BrandedEventLog/index.js";
