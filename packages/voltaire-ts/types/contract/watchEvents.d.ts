/**
 * @typedef {import('./EventStreamType.js').WatchOptions} WatchOptions
 * @typedef {import('../provider/TypedProvider.js').TypedProvider} TypedProvider
 */
/**
 * @typedef {object} WatchContext
 * @property {TypedProvider} provider
 * @property {string} addressHex
 * @property {(string | null)[]} topicsHex
 * @property {(log: any) => import('./EventStreamType.js').DecodedEventLog<any>} decodeLog
 * @property {(log: any) => string} getLogKey
 */
/**
 * Watch for new events by polling.
 *
 * Continuously polls for new blocks and fetches matching events.
 *
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @param {WatchContext} context
 * @param {WatchOptions} [watchOptions]
 * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
 */
export function watchEvents<TEvent extends import("../primitives/Abi/event/EventType.js").EventType>(context: WatchContext, watchOptions?: WatchOptions): AsyncGenerator<import("./EventStreamType.js").EventStreamResult<TEvent>>;
export type WatchOptions = import("./EventStreamType.js").WatchOptions;
export type TypedProvider = import("../provider/TypedProvider.js").TypedProvider;
export type WatchContext = {
    provider: TypedProvider;
    addressHex: string;
    topicsHex: (string | null)[];
    decodeLog: (log: any) => import("./EventStreamType.js").DecodedEventLog<any>;
    getLogKey: (log: any) => string;
};
//# sourceMappingURL=watchEvents.d.ts.map