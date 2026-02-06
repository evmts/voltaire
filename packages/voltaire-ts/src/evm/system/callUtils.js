/**
 * Shared utilities for CALL-type opcodes (CALL, CALLCODE, DELEGATECALL, STATICCALL)
 */

/**
 * Pop value from stack
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../Frame/FrameType.js").EvmError}}
 */
export function popStack(frame) {
	if (frame.stack.length === 0) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = /** @type {bigint} */ (frame.stack.pop());
	return { value, error: null };
}

/**
 * Push value to stack
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} value
 * @returns {import("../Frame/FrameType.js").EvmError | null}
 */
export function pushStack(frame, value) {
	if (frame.stack.length >= 1024) {
		return { type: "StackOverflow" };
	}
	frame.stack.push(value);
	return null;
}

/**
 * Consume gas from frame
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../Frame/FrameType.js").EvmError | null}
 */
export function consumeGas(frame, amount) {
	if (frame.gasRemaining < amount) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}
	frame.gasRemaining -= amount;
	return null;
}

/**
 * Read byte from memory
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} offset
 * @returns {number}
 */
export function readMemory(frame, offset) {
	return frame.memory.get(offset) ?? 0;
}

/**
 * Write byte to memory
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} offset
 * @param {number} value
 */
export function writeMemory(frame, offset, value) {
	frame.memory.set(offset, value);
}

/**
 * Calculate word count (32-byte words)
 * @param {number} bytes
 * @returns {number}
 */
export function wordCount(bytes) {
	return Math.ceil(bytes / 32);
}

/**
 * Calculate word-aligned size
 * @param {number} bytes
 * @returns {number}
 */
export function wordAlignedSize(bytes) {
	const words = wordCount(bytes);
	return words * 32;
}

/**
 * Calculate memory expansion cost
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} endBytes
 * @returns {bigint}
 */
export function memoryExpansionCost(frame, endBytes) {
	const currentSize = frame.memorySize;

	if (endBytes <= currentSize) return 0n;

	const maxMemory = 0x1000000;
	if (endBytes > maxMemory) return BigInt(Number.MAX_SAFE_INTEGER);

	const newWords = wordCount(endBytes);
	const newCost =
		BigInt(newWords * 3) + BigInt(Math.floor((newWords * newWords) / 512));

	const currentWords = wordCount(currentSize);
	const currentCost =
		BigInt(currentWords * 3) +
		BigInt(Math.floor((currentWords * currentWords) / 512));

	return newCost - currentCost;
}

/**
 * Convert bigint address to 20-byte Uint8Array
 * @param {bigint} addr
 * @returns {import("../../primitives/Address/AddressType.js").AddressType}
 */
export function bigintToAddress(addr) {
	const bytes = new Uint8Array(20);
	let val = addr;
	for (let i = 19; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val >>= 8n;
	}
	return /** @type {import("../../primitives/Address/AddressType.js").AddressType} */ (
		bytes
	);
}
