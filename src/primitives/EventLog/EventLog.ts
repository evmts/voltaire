/**
 * EventLog Type Definitions
 */

// Re-export types
export type { BrandedEventLog, Filter } from "./BrandedEventLog.js";

// For backwards compatibility, export BrandedEventLog as Data and EventLog
export type { BrandedEventLog as Data } from "./BrandedEventLog.js";

// Re-export runtime functions
export { clone } from "./clone.js";
export { copy } from "./copy.js";
export { create } from "./create.js";
export { filterLogs } from "./filterLogs.js";
export { from } from "./from.js";
export { getIndexed } from "./getIndexed.js";
export { getIndexedTopics } from "./getIndexedTopics.js";
export { getSignature } from "./getSignature.js";
export { getTopic0 } from "./getTopic0.js";
export { isRemoved } from "./isRemoved.js";
export { matchesAddress } from "./matchesAddress.js";
export { matchesFilter } from "./matchesFilter.js";
export { matchesTopics } from "./matchesTopics.js";
export { sortLogs } from "./sortLogs.js";
export { wasRemoved } from "./wasRemoved.js";
