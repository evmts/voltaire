/**
 * CREATE opcode (0xf0) - Create a new contract
 *
 * Stack: [value, offset, length] => [address]
 * Gas: 32000 + memory expansion + init code hash cost
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function create(frame) {
	// EIP-214: CREATE cannot be executed in static call context
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

	// Check value doesn't exceed max safe integer for gas calculations
	if (length > BigInt(Number.MAX_SAFE_INTEGER)) {
		return { type: "OutOfBounds" };
	}

	const len = Number(length);

	// Calculate gas cost
	// Base: 32000 gas
	// + init code word cost (EIP-3860: 2 gas per word)
	const wordCount = Math.ceil(len / 32);
	let gasCost = 32000n + BigInt(wordCount * 2);

	// Memory expansion cost
	if (len > 0) {
		if (offset > BigInt(Number.MAX_SAFE_INTEGER)) {
			return { type: "OutOfBounds" };
		}
		const off = Number(offset);
		const endBytes = off + len;
		const memCost = memoryExpansionCost(frame, endBytes);
		gasCost += memCost;

		// Update memory size
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

	// TODO: Actual nested call execution
	// For now, push 0 (failure) to stack
	// In a full implementation:
	// 1. Increment nonce
	// 2. Calculate new contract address: keccak256(rlp([sender, nonce]))
	// 3. Check call depth (max 1024)
	// 4. Check balance sufficient for value transfer
	// 5. Execute init code in new context
	// 6. Store returned code if successful

	// Clear return data
	frame.returnData = new Uint8Array(0);

	// Push failure address (0) to stack
	const pushErr = pushStack(frame, 0n);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null}
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
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../Frame/BrandedFrame.js").EvmError}}
 */
function popStack(frame) {
	if (frame.stack.length === 0) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = frame.stack.pop();
	return { value, error: null };
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @param {bigint} value
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null}
 */
function pushStack(frame, value) {
	if (frame.stack.length >= 1024) {
		return { type: "StackOverflow" };
	}
	frame.stack.push(value);
	return null;
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
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
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @param {number} endBytes
 * @returns {bigint}
 */
function memoryExpansionCost(frame, endBytes) {
	const currentSize = frame.memorySize;

	if (endBytes <= currentSize) return 0n;

	// Cap memory size to prevent overflow (16MB max)
	const maxMemory = 0x1000000;
	if (endBytes > maxMemory) return BigInt(Number.MAX_SAFE_INTEGER);

	// Calculate cost for new size
	const newWords = wordCount(endBytes);
	const newCost = BigInt(newWords * 3) + BigInt((newWords * newWords) / 512);

	// Calculate cost for current size
	const currentWords = wordCount(currentSize);
	const currentCost =
		BigInt(currentWords * 3) + BigInt((currentWords * currentWords) / 512);

	return newCost - currentCost;
}
