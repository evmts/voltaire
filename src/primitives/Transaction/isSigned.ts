import type { Any } from "./types.js";
import { assertSigned } from "./assertSigned.js";

/**
 * Check if transaction is signed
 */
export function isSigned(this: Any): boolean {
	try {
		assertSigned.call(this);
		return true;
	} catch {
		return false;
	}
}
