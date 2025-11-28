import { add } from "../arithmetic/0x01_ADD.js";
import { mul } from "../arithmetic/0x02_MUL.js";
import { sub } from "../arithmetic/0x03_SUB.js";
import { div } from "../arithmetic/0x04_DIV.js";
import { sdiv } from "../arithmetic/0x05_SDIV.js";
import { mod } from "../arithmetic/0x06_MOD.js";
import { smod } from "../arithmetic/0x07_SMOD.js";
import { addmod } from "../arithmetic/0x08_ADDMOD.js";
import { mulmod } from "../arithmetic/0x09_MULMOD.js";
import { exp } from "../arithmetic/0x0a_EXP.js";
import { signextend } from "../arithmetic/0x0b_SIGNEXTEND.js";

/**
 * Create a new Frame instance
 *
 * @param {object} params - Frame initialization parameters
 * @param {Uint8Array} [params.bytecode] - Bytecode to execute (default: empty)
 * @param {bigint} [params.gas] - Initial gas (default: 1000000)
 * @param {import("../../primitives/Address/AddressType.js").AddressType} [params.caller] - Caller address
 * @param {import("../../primitives/Address/AddressType.js").AddressType} [params.address] - Current address
 * @param {bigint} [params.value] - Value transferred (default: 0)
 * @param {Uint8Array} [params.calldata] - Call data (default: empty)
 * @param {boolean} [params.isStatic=false] - Static call flag
 * @param {bigint[]} [params.stack] - Initial stack (overrides default empty)
 * @param {bigint} [params.gasRemaining] - Overrides gas parameter
 * @returns {import("./FrameType.js").BrandedFrame} New Frame instance
 */
export function from({
	bytecode = new Uint8Array(0),
	gas = 1000000n,
	caller = new Uint8Array(20),
	address = new Uint8Array(20),
	value = 0n,
	calldata = new Uint8Array(0),
	isStatic = false,
	stack = [],
	gasRemaining,
}) {
	const frame = /** @type {import("./FrameType.js").BrandedFrame} */ ({
		stack,
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining: gasRemaining ?? gas,
		bytecode,
		caller,
		address,
		value,
		calldata,
		output: new Uint8Array(0),
		returnData: new Uint8Array(0),
		stopped: false,
		reverted: false,
		isStatic,
		authorized: null,
		callDepth: 0,
	});

	// Attach arithmetic instance methods
	frame.add = () => add(frame);
	frame.mul = () => mul(frame);
	frame.sub = () => sub(frame);
	frame.div = () => div(frame);
	frame.sdiv = () => sdiv(frame);
	frame.mod = () => mod(frame);
	frame.smod = () => smod(frame);
	frame.addmod = () => addmod(frame);
	frame.mulmod = () => mulmod(frame);
	frame.exp = () => exp(frame);
	frame.signextend = () => signextend(frame);

	return frame;
}
