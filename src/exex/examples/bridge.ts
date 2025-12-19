import type { AddressType } from "../../primitives/Address/AddressType.js";
import type { EventLogType } from "../../primitives/EventLog/EventLogType.js";
import type { HashType } from "../../primitives/Hash/HashType.js";
import { TevmPlugin, type TevmPluginBuilder } from "../TevmPluginBuilder.js";

/**
 * Example: Bridge deposit watcher TevmPlugin
 *
 * Watches for deposit events on a bridge contract and processes them.
 * Handles reverts by marking deposits as invalidated.
 *
 * @example
 * ```typescript
 * const exex = createBridgeWatcher({
 *   bridgeAddress: Address.from('0x...'),
 *   depositTopic: Hash.from('0x...'),
 *   onDeposit: async (log) => { ... },
 *   onRevert: async (log) => { ... },
 * });
 *
 * const manager = new TevmPluginManager(node, contextFactory);
 * await manager.run({ id: 'bridge', exex });
 * ```
 */
export function createBridgeWatcher(config: BridgeConfig): TevmPluginBuilder {
	const { bridgeAddress, depositTopic, onDeposit, onRevert } = config;

	return TevmPlugin()
		.onCommit(async (ctx) => {
			for (const block of ctx.chain.blocks) {
				const receipts = ctx.chain.receipts.get(block.hash) ?? [];
				for (const receipt of receipts) {
					for (const log of receipt.logs) {
						if (isDepositLog(log, bridgeAddress, depositTopic)) {
							await onDeposit(log);
						}
					}
				}
			}
			ctx.checkpoint();
		})
		.onRevert(async (ctx) => {
			if (onRevert) {
				for (const block of ctx.chain.blocks) {
					const receipts = ctx.chain.receipts.get(block.hash) ?? [];
					for (const receipt of receipts) {
						for (const log of receipt.logs) {
							if (isDepositLog(log, bridgeAddress, depositTopic)) {
								await onRevert(log);
							}
						}
					}
				}
			}
			ctx.checkpoint();
		})
		.onReorg(async (ctx) => {
			// Revert old deposits
			if (onRevert) {
				for (const block of ctx.reverted.blocks) {
					const receipts = ctx.reverted.receipts.get(block.hash) ?? [];
					for (const receipt of receipts) {
						for (const log of receipt.logs) {
							if (isDepositLog(log, bridgeAddress, depositTopic)) {
								await onRevert(log);
							}
						}
					}
				}
			}

			// Process new deposits
			for (const block of ctx.committed.blocks) {
				const receipts = ctx.committed.receipts.get(block.hash) ?? [];
				for (const receipt of receipts) {
					for (const log of receipt.logs) {
						if (isDepositLog(log, bridgeAddress, depositTopic)) {
							await onDeposit(log);
						}
					}
				}
			}

			ctx.checkpoint(ctx.committed.tip());
		});
}

function isDepositLog(
	log: EventLogType,
	bridgeAddress: AddressType,
	depositTopic: HashType,
): boolean {
	// Compare addresses (both are Uint8Array)
	if (log.address.length !== bridgeAddress.length) return false;
	for (let i = 0; i < log.address.length; i++) {
		if (log.address[i] !== bridgeAddress[i]) return false;
	}
	// Check topic
	if (log.topics.length === 0) return false;
	const topic = log.topics[0];
	if (!topic || topic.length !== depositTopic.length) return false;
	for (let i = 0; i < topic.length; i++) {
		if (topic[i] !== depositTopic[i]) return false;
	}
	return true;
}

/**
 * Configuration for bridge watcher
 */
export interface BridgeConfig {
	/** Bridge contract address */
	bridgeAddress: AddressType;
	/** Deposit event topic (keccak256 of event signature) */
	depositTopic: HashType;
	/** Called when deposit event is found */
	onDeposit: (log: EventLogType) => Promise<void>;
	/** Called when deposit is reverted (optional) */
	onRevert?: (log: EventLogType) => Promise<void>;
}
