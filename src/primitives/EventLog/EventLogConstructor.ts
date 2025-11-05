import type { BrandedEventLog } from "./BrandedEventLog.js";
import type { create } from "./create.js";
import type { matchesAddress } from "./matchesAddress.js";
import type { matchesFilter } from "./matchesFilter.js";
import type { matchesTopics } from "./matchesTopics.js";

type EventLogPrototype = BrandedEventLog & {
	getTopic0: typeof getTopic0;
	getIndexedTopics: typeof getIndexedTopics;
	getSignature: typeof getSignature;
	getIndexed: typeof getIndexed;
	matchesTopics: typeof matchesTopics;
	matches: typeof matchesTopics;
	matchesAddress: typeof matchesAddress;
	matchesAddr: typeof matchesAddress;
	matchesFilter: typeof matchesFilter;
	matchesAll: typeof matchesFilter;
	isRemoved: typeof isRemoved;
	wasRemoved: typeof wasRemoved;
	clone: typeof clone;
	copy: typeof copy;
};

// Import function signatures (these don't exist yet, will create stubs)
declare function getTopic0<T extends BrandedEventLog>(
	log: T,
): import("../Hash/index.js").Hash | undefined;
declare function getIndexedTopics<T extends BrandedEventLog>(
	log: T,
): readonly import("../Hash/index.js").Hash[];
declare function getSignature<T extends BrandedEventLog>(
	log: T,
): import("../Hash/index.js").Hash | undefined;
declare function getIndexed<T extends BrandedEventLog>(
	log: T,
): readonly import("../Hash/index.js").Hash[];
declare function isRemoved<T extends BrandedEventLog>(log: T): boolean;
declare function wasRemoved<T extends BrandedEventLog>(log: T): boolean;
declare function clone<T extends BrandedEventLog>(log: T): T;
declare function copy<T extends BrandedEventLog>(log: T): T;

export interface EventLogConstructor {
	(params: Parameters<typeof create>[0]): EventLogPrototype;
	prototype: EventLogPrototype;
	create(params: Parameters<typeof create>[0]): EventLogPrototype;
	getTopic0: typeof getTopic0;
	getIndexedTopics: typeof getIndexedTopics;
	getSignature: typeof getSignature;
	getIndexed: typeof getIndexed;
	matchesTopics: typeof matchesTopics;
	matches: typeof matchesTopics;
	matchesAddress: typeof matchesAddress;
	matchesAddr: typeof matchesAddress;
	matchesFilter: typeof matchesFilter;
	matchesAll: typeof matchesFilter;
	isRemoved: typeof isRemoved;
	wasRemoved: typeof wasRemoved;
	clone: typeof clone;
	copy: typeof copy;
	filterLogs: typeof filterLogs;
	filter: typeof filter;
	sortLogs: typeof sortLogs;
	sort: typeof sort;
}

// Array operation stubs
declare function filterLogs<T extends BrandedEventLog>(
	logs: readonly T[],
	filter: import("./BrandedEventLog.js").Filter,
): T[];
declare function filter<T extends BrandedEventLog>(
	logs: readonly T[],
	filter: import("./BrandedEventLog.js").Filter,
): T[];
declare function sortLogs<T extends BrandedEventLog>(logs: readonly T[]): T[];
declare function sort<T extends BrandedEventLog>(logs: readonly T[]): T[];
