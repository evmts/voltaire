/**
 * Example TevmPlugin implementations
 *
 * These demonstrate common patterns for building TevmPlugines:
 * - indexer: Database indexing with reorg handling
 * - bridge: Event watching for cross-chain bridges
 * - analytics: Batched event collection
 * - withMiddleware: Composing middleware for cross-cutting concerns
 */

export {
	createIndexer,
	type IndexerDatabase,
	type IndexerTransaction,
} from "./indexer.js";
export { createBridgeWatcher, type BridgeConfig } from "./bridge.js";
export { createAnalytics, type AnalyticsConfig } from "./analytics.js";
export { createWithMiddleware } from "./withMiddleware.js";
