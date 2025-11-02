import type { Any } from "./types.js";

/**
 * Assert transaction is signed (has non-zero signature)
 */
export function assertSigned(this: Any): void {
	const isZeroR = this.r.every((b) => b === 0);
	const isZeroS = this.s.every((b) => b === 0);

	if (isZeroR || isZeroS) {
		throw new Error("Transaction is not signed");
	}
}
