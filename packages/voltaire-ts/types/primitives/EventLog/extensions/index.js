/**
 * Voltaire EventLog extensions
 *
 * These extensions provide additional filtering, transformation, and utility
 * functions beyond what Ox's Log module provides.
 *
 * @module
 */
export { clone } from "./clone.js";
export { copy } from "./copy.js";
export { filterLogs } from "./filterLogs.js";
export { getIndexed } from "./getIndexed.js";
export { getIndexedTopics } from "./getIndexedTopics.js";
export { getSignature } from "./getSignature.js";
export { getTopic0 } from "./getTopic0.js";
export { isRemoved } from "./isRemoved.js";
export { matchesAddress } from "./matchesAddress.js";
export { matchesFilter } from "./matchesFilter.js";
export { matchesTopics } from "./matchesTopics.js";
export { sortLogs } from "./sortLogs.js";
// Internal utilities
export { addressEquals, hashEquals } from "./utils.js";
export { wasRemoved } from "./wasRemoved.js";
