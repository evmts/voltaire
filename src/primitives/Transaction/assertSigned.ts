import type { Any } from "./types.js";

/**
 * Assert transaction is signed (has non-zero signature)
 */
export function assertSigned(tx: Any): void {
	const isZeroR = tx.r.every((b) => b === 0);
	const isZeroS = tx.s.every((b) => b === 0);

	if (isZeroR || isZeroS) {
		throw new Error("Transaction is not signed");
	}
}
