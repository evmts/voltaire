/**
 * @fileoverview zkSync L2 formatter layer.
 *
 * @module zksync
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { FormatterService } from "../FormatterService.js";

/**
 * zkSync formatter layer.
 *
 * @since 0.0.1
 */
export const ZkSyncFormatter = Layer.succeed(FormatterService, {
	formatBlock: (rpc: unknown) => {
		const block = rpc as Record<string, unknown>;
		return Effect.succeed({
			...block,
			l1BatchNumber: block.l1BatchNumber,
		});
	},
	formatTransaction: (rpc: unknown) => {
		const tx = rpc as Record<string, unknown>;
		return Effect.succeed({
			...tx,
			l1BatchNumber: tx.l1BatchNumber,
			l1BatchTxIndex: tx.l1BatchTxIndex,
		});
	},
	formatReceipt: (rpc: unknown) => Effect.succeed(rpc),
	formatRequest: (tx: unknown) => Effect.succeed(tx),
});
