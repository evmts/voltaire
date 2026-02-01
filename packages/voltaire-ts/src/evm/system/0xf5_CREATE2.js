/**
 * CREATE2 opcode (0xf5) - Create a new contract with deterministic address
 *
 * Stack: [value, offset, length, salt] => [address]
 * Gas: 32000 + memory expansion + init code hash cost + keccak256 cost
 * Address: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))
 * Note: Introduced in EIP-1014 (Constantinople)
 *
 * ## Architecture Note
 *
 * This is a low-level opcode handler. For full nested execution, the host must
 * provide a `create` method. Full EVM implementations are in:
 * - **guillotine**: Production EVM with async state, tracing, full EIP support
 * - **guillotine-mini**: Lightweight synchronous EVM for testing
 *
 * When host.create is not provided, returns NotImplemented error.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} [host] - Host interface (optional)
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: opcode implementation
export function create2(frame, host) {
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

	// Check call depth (max 1024)
	if (frame.callDepth >= 1024) {
		const pushErr = pushStack(frame, 0n);
		if (pushErr) return pushErr;
		frame.pc += 1;
		return null;
	}

	// If host.create is not provided, return NotImplemented error
	// Full EVM implementations (guillotine/guillotine-mini) provide this method
	if (!host?.create) {
		return {
			type: "NotImplemented",
			message:
				"CREATE2 requires host.create() - use guillotine or guillotine-mini for full EVM execution",
		};
	}

	// Execute nested create via host (with salt for CREATE2)
	const result = host.create({
		caller: frame.address,
		value,
		initCode,
		gasLimit: maxGas,
		depth: frame.callDepth + 1,
		salt, // CREATE2 includes salt for deterministic address
	});

	// Store return data for RETURNDATASIZE/RETURNDATACOPY
	frame.returnData = result.output;

	// Refund unused gas
	const gasRefund = maxGas - result.gasUsed;
	if (gasRefund > 0n) {
		frame.gasRemaining += gasRefund;
	}

	// Add gas refunds from child
	if (result.gasRefund > 0n) {
		frame.gasRefunds = (frame.gasRefunds ?? 0n) + result.gasRefund;
	}

	// Push address (success) or 0 (failure) to stack
	if (result.success && result.address) {
		const addrBigint = addressToBigint(result.address);
		const pushErr = pushStack(frame, addrBigint);
		if (pushErr) return pushErr;
	} else {
		const pushErr = pushStack(frame, 0n);
		if (pushErr) return pushErr;
	}

	frame.pc += 1;
	return null;
}

/**
 * Convert 20-byte address to bigint
 * @param {Uint8Array} addr
 * @returns {bigint}
 */
function addressToBigint(addr) {
	let result = 0n;
	for (let i = 0; i < 20; i++) {
		result = (result << 8n) | BigInt(/** @type {number} */ (addr[i]));
	}
	return result;
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
	const value = /** @type {bigint} */ (frame.stack.pop());
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
