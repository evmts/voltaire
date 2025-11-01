import type { Any } from "./types.js";
import { assertSigned } from "./assertSigned.js";

/**
 * Check if transaction is signed
 */
export function isSigned(tx: Any): boolean {
	try {
		assertSigned(tx);
		return true;
	} catch {
		return false;
	}
}
