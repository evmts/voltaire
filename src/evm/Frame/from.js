/**
 * Create a new Frame instance
 *
 * @param {object} params - Frame initialization parameters
 * @param {Uint8Array} params.bytecode - Bytecode to execute
 * @param {bigint} params.gas - Initial gas
 * @param {import("../../primitives/Address/BrandedAddress.js").Address} params.caller - Caller address
 * @param {import("../../primitives/Address/BrandedAddress.js").Address} params.address - Current address
 * @param {bigint} params.value - Value transferred
 * @param {Uint8Array} params.calldata - Call data
 * @param {boolean} [params.isStatic=false] - Static call flag
 * @returns {import("./BrandedFrame.js").BrandedFrame} New Frame instance
 */
export function from({
	bytecode,
	gas,
	caller,
	address,
	value,
	calldata,
	isStatic = false,
}) {
	return /** @type {import("./BrandedFrame.js").BrandedFrame} */ ({
		__tag: "Frame",
		stack: [],
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining: gas,
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
}
