import { PrimitiveError } from "../errors/PrimitiveError.js";
/**
 * Error thrown when unwrapping a failed contract result
 */
export class ContractRevertError extends PrimitiveError {
    revertReason;
    constructor(message, revertReason) {
        super(message, { context: { revertReason } });
        this.name = "ContractRevertError";
        this.revertReason = revertReason;
    }
}
