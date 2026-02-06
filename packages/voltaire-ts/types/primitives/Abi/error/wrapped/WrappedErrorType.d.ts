import type { AddressType } from "../../../Address/AddressType.js";
import type { BytesType } from "../../../Bytes/BytesType.js";
import type { SelectorType } from "../../../Selector/SelectorType.js";
/**
 * ERC-7751 Wrapped Error type
 *
 * Represents a wrapped execution error with additional context about the failing contract,
 * function, and original revert reason.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7751
 * @since 0.0.0
 */
export type WrappedErrorType = {
    /** Address of contract that reverted */
    target: AddressType;
    /** Function selector that was called */
    selector: SelectorType;
    /** Original revert reason data */
    reason: BytesType;
    /** Additional error details/context */
    details: BytesType;
};
//# sourceMappingURL=WrappedErrorType.d.ts.map