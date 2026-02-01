import { PrimitiveError } from "../errors/PrimitiveError.js";
import type { RevertReasonType } from "../RevertReason/RevertReasonType.js";
/**
 * Error thrown when unwrapping a failed contract result
 */
export declare class ContractRevertError extends PrimitiveError {
    readonly revertReason: RevertReasonType;
    constructor(message: string, revertReason: RevertReasonType);
}
//# sourceMappingURL=errors.d.ts.map