/**
 * EventLog Type Definitions
 */

// Re-export types
export type { BrandedEventLog, Filter } from "./BrandedEventLog.js";

// For backwards compatibility, export BrandedEventLog as Data and EventLog
export type { BrandedEventLog as Data } from "./BrandedEventLog.js";
export type { BrandedEventLog as EventLog } from "./BrandedEventLog.js";
