import type { brand } from "../../brand.js";
import type { OpcodeType } from "../Opcode/OpcodeType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Single opcode execution step
 * Represents the EVM state at a specific instruction
 *
 * @see https://voltaire.tevm.sh/primitives/op-step for OpStep documentation
 * @since 0.0.0
 */
export type OpStepType = {
	readonly [brand]: "OpStep";
	/** Program counter (bytecode offset) */
	readonly pc: number;
	/** Opcode number (0x00-0xFF) */
	readonly op: OpcodeType;
	/** Remaining gas before executing this operation */
	readonly gas: Uint256Type;
	/** Gas cost for this operation */
	readonly gasCost: Uint256Type;
	/** Call depth (0 for top-level call) */
	readonly depth: number;
	/** Stack state (top to bottom) */
	readonly stack?: readonly Uint256Type[];
	/** Memory state (raw bytes) */
	readonly memory?: Uint8Array;
	/** Storage changes in this step (key -> value) */
	readonly storage?: Record<string, Uint256Type>;
	/** Error message if step failed */
	readonly error?: string;
};
