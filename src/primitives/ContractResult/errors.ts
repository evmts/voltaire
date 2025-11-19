import { PrimitiveError } from "../errors/PrimitiveError.js";
import type { RevertReasonType } from "../RevertReason/RevertReasonType.js";

/**
 * Error thrown when unwrapping a failed contract result
 */
export class ContractRevertError extends PrimitiveError {
	public readonly revertReason: RevertReasonType;

	constructor(message: string, revertReason: RevertReasonType) {
		super(message, { context: { revertReason } });
		this.name = "ContractRevertError";
		this.revertReason = revertReason;
	}
}
