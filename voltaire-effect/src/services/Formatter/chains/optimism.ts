/**
 * @fileoverview Optimism L2 formatter layer.
 *
 * @module optimism
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { FormatterService } from "../FormatterService.js";

/**
 * Optimism (OP Stack) formatter layer.
 *
 * @since 0.0.1
 */
export const OptimismFormatter = Layer.succeed(FormatterService, {
	formatBlock: (rpc: unknown) => Effect.succeed(rpc),
	formatTransaction: (rpc: unknown) => {
		const tx = rpc as Record<string, unknown>;
		return Effect.succeed({
			...tx,
			depositNonce: tx.depositNonce,
			isSystemTx: tx.isSystemTx,
		});
	},
	formatReceipt: (rpc: unknown) => {
		const receipt = rpc as Record<string, unknown>;
		return Effect.succeed({
			...receipt,
			l1Fee: receipt.l1Fee,
			l1FeeScalar: receipt.l1FeeScalar,
		});
	},
	formatRequest: (tx: unknown) => Effect.succeed(tx),
});
