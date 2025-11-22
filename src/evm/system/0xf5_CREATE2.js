/**
 * CREATE2 opcode (0xf5) - Create a new contract with deterministic address
 *
 * Stack: [value, offset, length, salt] => [address]
 * Gas: 32000 + memory expansion + init code hash cost + keccak256 cost
 * Address: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))
 * Note: Introduced in EIP-1014 (Constantinople)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function create2(frame) {
	// EIP-1014 (Constantinople): CREATE2 requires Constantinople or later
	// In a full implementation, check hardfork version and return InvalidOpcode if earlier
	// For now, assume Constantinople or later

	// EIP-214: CREATE2 cannot be executed in static call context
	if (frame.isStatic) {
		return { type: "WriteProtection" };
	}

	// Pop arguments
	const resultValue = popStack(frame);
	if (resultValue.error) return resultValue.error;
	const value = resultValue.value;

	const resultOffset = popStack(frame);
	if (resultOffset.error) return resultOffset.error;
	const offset = resultOffset.value;

	const resultLength = popStack(frame);
	if (resultLength.error) return resultLength.error;
	const length = resultLength.value;

	const resultSalt = popStack(frame);
	if (resultSalt.error) return resultSalt.error;
	const salt = resultSalt.value;

	if (length > BigInt(Number.MAX_SAFE_INTEGER)) {
		return { type: "OutOfBounds" };
	}

	const len = Number(length);

	// Calculate gas cost
	// Base: 32000 gas
	// + init code word cost (EIP-3860: 2 gas per word)
	// + keccak256 cost for CREATE2 address calculation (6 gas per word)
	const wordCnt = Math.ceil(len / 32);
	let gasCost = 32000n + BigInt(wordCnt * 2) + BigInt(wordCnt * 6);

	// Memory expansion cost
	if (len > 0) {
		if (offset > BigInt(Number.MAX_SAFE_INTEGER)) {
			return { type: "OutOfBounds" };
		}
		const off = Number(offset);
		const endBytes = off + len;
		const memCost = memoryExpansionCost(frame, endBytes);
		gasCost += memCost;

		const newSize = wordAlignedSize(endBytes);
		if (newSize > frame.memorySize) {
			frame.memorySize = newSize;
		}
	}

	const gasErr = consumeGas(frame, gasCost);
	if (gasErr) return gasErr;

	// Read init code from memory
	const initCode = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		initCode[i] = readMemory(frame, Number(offset) + i);
	}

	// Calculate available gas for nested execution
	// EIP-150 (Tangerine Whistle): all but 1/64th
	const remainingGas = frame.gasRemaining;
	const maxGas = remainingGas - remainingGas / 64n;

	// Clear return data before execution
	frame.returnData = new Uint8Array(0);

	// Perform nested CREATE2 execution with deterministic address
	// In a full implementation:
	// 1. Hash initCode with keccak256
	// 2. Construct address preimage: 0xff (1 byte) ++ sender (20 bytes) ++ salt (32 bytes) ++ initCodeHash (32 bytes)
	// 3. Hash preimage with keccak256 to get address (take last 20 bytes)
	// 4. Check if account already exists at address (fail with collision if it does)
	// 5. Increment sender nonce
	// 6. Check call depth (max 1024)
	// 7. Check sender balance sufficient for value transfer
	// 8. Execute init code in new context at computed address
	// 9. Store returned bytecode at address if successful
	// 10. On success: push address to stack
	// 11. On failure: push 0 to stack, set returnData to child's output
	//
	// Key differences from CREATE:
	// - Address is deterministic (based on salt) vs nonce-based
	// - Same initCode with different salt = different address
	// - Collision check: if address exists, creation fails
	// - Extra keccak256 cost: 6 gas per word (EIP-1014)
	//
	// For now (stub implementation): push 0 (failure) to stack
	// Full implementation requires EVM state access and keccak256 support

	// Push failure address (0) to stack
	const pushErr = pushStack(frame, 0n);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}

/**
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../Frame/FrameType.js").EvmError | null}
 */
function consumeGas(frame, amount) {
	if (frame.gasRemaining < amount) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}
	frame.gasRemaining -= amount;
	return null;
}

/**
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../Frame/FrameType.js").EvmError}}
 */
function popStack(frame) {
	if (frame.stack.length === 0) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = frame.stack.pop();
	return { value, error: null };
}

/**
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} value
 * @returns {import("../Frame/FrameType.js").EvmError | null}
 */
function pushStack(frame, value) {
	if (frame.stack.length >= 1024) {
		return { type: "StackOverflow" };
	}
	frame.stack.push(value);
	return null;
}

/**
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} offset
 * @returns {number}
 */
function readMemory(frame, offset) {
	return frame.memory.get(offset) ?? 0;
}

/**
 * @param {number} bytes
 * @returns {number}
 */
function wordCount(bytes) {
	return Math.ceil(bytes / 32);
}

/**
 * @param {number} bytes
 * @returns {number}
 */
function wordAlignedSize(bytes) {
	const words = wordCount(bytes);
	return words * 32;
}

/**
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} endBytes
 * @returns {bigint}
 */
function memoryExpansionCost(frame, endBytes) {
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
