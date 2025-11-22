/**
 * DELEGATECALL opcode (0xf4) - Message call with another account's code, preserving msg.sender and msg.value
 *
 * Stack: [gas, address, inOffset, inLength, outOffset, outLength] => [success]
 * Gas: Similar to CALL but no value parameter (preserves current msg.value)
 * Note: Introduced in EIP-7 (Homestead)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function delegatecall(frame) {
	// EIP-7 (Homestead): DELEGATECALL requires Homestead or later
	// In a full implementation, check hardfork version and return InvalidOpcode if earlier
	// For now, assume Homestead or later

	// Pop 6 arguments (no value)
	const resultGas = popStack(frame);
	if (resultGas.error) return resultGas.error;
	const gas = resultGas.value;

	const resultAddress = popStack(frame);
	if (resultAddress.error) return resultAddress.error;
	const address = resultAddress.value;

	const resultInOffset = popStack(frame);
	if (resultInOffset.error) return resultInOffset.error;
	const inOffset = resultInOffset.value;

	const resultInLength = popStack(frame);
	if (resultInLength.error) return resultInLength.error;
	const inLength = resultInLength.value;

	const resultOutOffset = popStack(frame);
	if (resultOutOffset.error) return resultOutOffset.error;
	const outOffset = resultOutOffset.value;

	const resultOutLength = popStack(frame);
	if (resultOutLength.error) return resultOutLength.error;
	const outLength = resultOutLength.value;

	// Calculate base gas cost
	// EIP-150 (Tangerine Whistle): 700 gas base cost
	// Pre-Tangerine: 40 gas
	let gasCost = 700n;

	// No value transfer cost (DELEGATECALL has no value parameter, msg.value preserved from caller)

	// EIP-2929 (Berlin): cold account access cost
	// In a full implementation: if address is cold (not yet accessed), add 2600 gas; if warm, add 100 gas
	// For now: assume warm access (would require access list tracking)
	// const isWarm = frame.accessList?.includes(address);
	// gasCost += isWarm ? 100n : 2600n;

	// Calculate memory expansion cost
	if (
		inLength > BigInt(Number.MAX_SAFE_INTEGER) ||
		outLength > BigInt(Number.MAX_SAFE_INTEGER) ||
		inOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
		outOffset > BigInt(Number.MAX_SAFE_INTEGER)
	) {
		return { type: "OutOfBounds" };
	}

	const inLen = Number(inLength);
	const outLen = Number(outLength);
	const inOff = Number(inOffset);
	const outOff = Number(outOffset);

	const inEnd = inLen > 0 ? inOff + inLen : 0;
	const outEnd = outLen > 0 ? outOff + outLen : 0;
	const maxEnd = Math.max(inEnd, outEnd);

	if (maxEnd > 0) {
		const memCost = memoryExpansionCost(frame, maxEnd);
		gasCost += memCost;

		const newSize = wordAlignedSize(maxEnd);
		if (newSize > frame.memorySize) {
			frame.memorySize = newSize;
		}
	}

	// Calculate available gas
	const gasLimit =
		gas > BigInt(Number.MAX_SAFE_INTEGER)
			? BigInt(Number.MAX_SAFE_INTEGER)
			: gas;
	const remainingGasBeforeCharge = frame.gasRemaining;
	const gasAfterCharge =
		remainingGasBeforeCharge >= gasCost
			? remainingGasBeforeCharge - gasCost
			: 0n;
	const maxGas = gasAfterCharge - gasAfterCharge / 64n;
	const availableGas = gasLimit < maxGas ? gasLimit : maxGas;

	// Charge total cost
	const totalCost = gasCost + availableGas;
	const gasErr = consumeGas(frame, totalCost);
	if (gasErr) return gasErr;

	// Read input data
	const inputData = new Uint8Array(inLen);
	for (let i = 0; i < inLen; i++) {
		inputData[i] = readMemory(frame, inOff + i);
	}

	// Perform nested DELEGATECALL execution
	// DELEGATECALL executes target's code in current context:
	// - msg.sender stays the ORIGINAL sender (frame.caller, not frame.address)
	// - msg.value stays the ORIGINAL value (not transferred, preserves caller's msg.value)
	// - Uses current account's storage, balance, and nonce
	// - Only borrows code from target address
	// - Modifications to storage affect current account
	//
	// In a full implementation:
	// 1. Check call depth (max 1024)
	// 2. Fetch code from target address
	// 3. Create new frame with caller=frame.caller, address=frame.address, value=frame.value
	// 4. Execute target code in this new frame with current storage/balance
	// 5. Copy output to memory at outOffset
	// 6. Refund unused gas
	// 7. Store return data
	//
	// For now (stub implementation): push 0 (failure) to stack
	// Full implementation requires EVM state access and nested frame creation

	frame.returnData = new Uint8Array(0);

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
