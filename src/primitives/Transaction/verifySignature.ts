import type { BrandedTransactionEIP1559 } from "./EIP1559/BrandedTransactionEIP1559.js";
import type { BrandedTransactionEIP2930 } from "./EIP2930/BrandedTransactionEIP2930.js";
import type { BrandedTransactionEIP4844 } from "./EIP4844/BrandedTransactionEIP4844.js";
import type { BrandedTransactionEIP7702 } from "./EIP7702/BrandedTransactionEIP7702.js";
import type { BrandedTransactionLegacy } from "./Legacy/BrandedTransactionLegacy.js";
import * as EIP1559 from "./EIP1559/verifySignature.js";
import * as EIP2930 from "./EIP2930/verifySignature.js";
import * as EIP4844 from "./EIP4844/verifySignature.js";
import * as EIP7702 from "./EIP7702/verifySignature.js";
import * as Legacy from "./Legacy/verifySignature.js";
import { type Any, Type } from "./types.js";

/**
 * Verify transaction signature
 */
export function verifySignature(this: Any): boolean {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.verifySignature.call(
				this as unknown as BrandedTransactionLegacy,
			);
		case Type.EIP2930:
			return EIP2930.verifySignature(
				this as unknown as BrandedTransactionEIP2930,
			);
		case Type.EIP1559:
			return EIP1559.verifySignature(
				this as unknown as BrandedTransactionEIP1559,
			);
		case Type.EIP4844:
			return EIP4844.verifySignature(
				this as unknown as BrandedTransactionEIP4844,
			);
		case Type.EIP7702:
			return EIP7702.verifySignature(
				this as unknown as BrandedTransactionEIP7702,
			);
		default:
			throw new Error(`Unknown transaction type: ${(this as any).type}`);
	}
}
