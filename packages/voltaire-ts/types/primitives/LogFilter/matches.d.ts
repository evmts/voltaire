/**
 * Check if a log entry matches this filter
 *
 * @param {import('./LogFilterType.js').LogFilterType} filter
 * @param {import('../EventLog/EventLogType.js').EventLogType} log - Log entry to test
 * @returns {boolean}
 * @example
 * ```javascript
 * import * as LogFilter from './primitives/LogFilter/index.js';
 * const matches = LogFilter.matches(filter, log);
 * ```
 */
export function matches(filter: import("./LogFilterType.js").LogFilterType, log: import("../EventLog/EventLogType.js").EventLogType): boolean;
//# sourceMappingURL=matches.d.ts.map