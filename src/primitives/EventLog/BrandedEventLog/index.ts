// @ts-nocheck
export * from "./BrandedEventLog.js";

import { clone } from "./clone.js";
import { copy } from "./copy.js";
import { create } from "./create.js";
import { filterLogs } from "./filterLogs.js";
import { from } from "./from.js";
import { getIndexed } from "./getIndexed.js";
import { getIndexedTopics } from "./getIndexedTopics.js";
import { getSignature } from "./getSignature.js";
import { getTopic0 } from "./getTopic0.js";
import { isRemoved } from "./isRemoved.js";
import { matchesAddress } from "./matchesAddress.js";
import { matchesFilter } from "./matchesFilter.js";
import { matchesTopics } from "./matchesTopics.js";
import { sortLogs } from "./sortLogs.js";
import { wasRemoved } from "./wasRemoved.js";

// Export individual functions
export {
	clone,
	copy,
	create,
	filterLogs,
	from,
	getIndexed,
	getIndexedTopics,
	getSignature,
	getTopic0,
	isRemoved,
	matchesAddress,
	matchesFilter,
	matchesTopics,
	sortLogs,
	wasRemoved,
};

// Namespace export
export const BrandedEventLog = {
	clone,
	copy,
	create,
	filterLogs,
	from,
	getIndexed,
	getIndexedTopics,
	getSignature,
	getTopic0,
	isRemoved,
	matchesAddress,
	matchesFilter,
	matchesTopics,
	sortLogs,
	wasRemoved,
};
