/**
 * Voltaire EventLog extensions
 *
 * These extensions provide additional filtering, transformation, and utility
 * functions beyond what Ox's Log module provides.
 *
 * @module
 */

export { getTopic0 } from "./getTopic0.js";
export { getIndexedTopics } from "./getIndexedTopics.js";
export { getSignature } from "./getSignature.js";
export { getIndexed } from "./getIndexed.js";
export { isRemoved } from "./isRemoved.js";
export { wasRemoved } from "./wasRemoved.js";
export { clone } from "./clone.js";
export { copy } from "./copy.js";
export { matchesTopics } from "./matchesTopics.js";
export { matchesAddress } from "./matchesAddress.js";
export { matchesFilter } from "./matchesFilter.js";
export { filterLogs } from "./filterLogs.js";
export { sortLogs } from "./sortLogs.js";

// Internal utilities
export { hashEquals, addressEquals } from "./utils.js";
