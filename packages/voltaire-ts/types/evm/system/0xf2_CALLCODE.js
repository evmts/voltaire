import { bigintToAddress, consumeGas, memoryExpansionCost, popStack, pushStack, readMemory, wordAlignedSize, writeMemory, } from "./callUtils.js";
/**
 * CALLCODE opcode (0xf2) - Message call into this account with another account's code
 *
 * Stack: [gas, address, value, inOffset, inLength, outOffset, outLength] => [success]
 * Gas: Similar to CALL but executes code in current context
 *
 * ## Architecture Note
 *
 * This is a low-level opcode handler. For full nested execution, the host must
 * provide a `call` method. Full EVM implementations are in:
 * - **guillotine**: Production EVM with async state, tracing, full EIP support
 * - **guillotine-mini**: Lightweight synchronous EVM for testing
 *
 * When host.call is not provided, returns NotImplemented error.
 *
 * Note: CALLCODE is deprecated in favor of DELEGATECALL (EIP-7).
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} [host] - Host interface (optional)
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: opcode implementation
export function callcode(frame, host) {
    // Pop all 7 arguments (same as CALL)
    const resultGas = popStack(frame);
    if (resultGas.error)
        return resultGas.error;
    const gas = resultGas.value;
    const resultAddress = popStack(frame);
    if (resultAddress.error)
        return resultAddress.error;
    const address = resultAddress.value;
    const resultValue = popStack(frame);
    if (resultValue.error)
        return resultValue.error;
    const value = resultValue.value;
    const resultInOffset = popStack(frame);
    if (resultInOffset.error)
        return resultInOffset.error;
    const inOffset = resultInOffset.value;
    const resultInLength = popStack(frame);
    if (resultInLength.error)
        return resultInLength.error;
    const inLength = resultInLength.value;
    const resultOutOffset = popStack(frame);
    if (resultOutOffset.error)
        return resultOutOffset.error;
    const outOffset = resultOutOffset.value;
    const resultOutLength = popStack(frame);
    if (resultOutLength.error)
        return resultOutLength.error;
    const outLength = resultOutLength.value;
    // Calculate base gas cost
    // EIP-150 (Tangerine Whistle): 700 gas
    let gasCost = 700n;
    // Value transfer cost (transfers from current account to itself)
    if (value > 0n) {
        gasCost += 9000n; // CallValueTransfer
        // No CallNewAccount cost since we don't create an account (code is at target, execution at current)
    }
    // EIP-2929 (Berlin): cold account access cost
    // If address is cold (not yet accessed), add 2600 gas; if warm, add 100 gas
    // In a full implementation:
    // const isWarm = frame.accessList?.includes(address);
    // gasCost += isWarm ? 100n : 2600n;
    // Calculate memory expansion cost
    if (inLength > BigInt(Number.MAX_SAFE_INTEGER) ||
        outLength > BigInt(Number.MAX_SAFE_INTEGER) ||
        inOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
        outOffset > BigInt(Number.MAX_SAFE_INTEGER)) {
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
    const gasLimit = gas > BigInt(Number.MAX_SAFE_INTEGER)
        ? BigInt(Number.MAX_SAFE_INTEGER)
        : gas;
    const remainingGasBeforeCharge = frame.gasRemaining;
    const gasAfterCharge = remainingGasBeforeCharge >= gasCost
        ? remainingGasBeforeCharge - gasCost
        : 0n;
    const maxGas = gasAfterCharge - gasAfterCharge / 64n;
    const availableGasWithoutStipend = gasLimit < maxGas ? gasLimit : maxGas;
    // Add stipend for value transfers
    const availableGas = value > 0n
        ? availableGasWithoutStipend + 2300n
        : availableGasWithoutStipend;
    // Charge total cost
    const totalCost = gasCost + availableGasWithoutStipend;
    const gasErr = consumeGas(frame, totalCost);
    if (gasErr)
        return gasErr;
    // Read input data
    const inputData = new Uint8Array(inLen);
    for (let i = 0; i < inLen; i++) {
        inputData[i] = readMemory(frame, inOff + i);
    }
    // Check call depth (max 1024)
    if (frame.callDepth >= 1024) {
        frame.returnData = new Uint8Array(0);
        const pushErr = pushStack(frame, 0n);
        if (pushErr)
            return pushErr;
        frame.pc += 1;
        return null;
    }
    // Convert address from bigint to bytes
    const targetAddress = bigintToAddress(address);
    // If host.call is not provided, return NotImplemented error
    // Full EVM implementations (guillotine/guillotine-mini) provide this method
    if (!host?.call) {
        return {
            type: "NotImplemented",
            message: "CALLCODE requires host.call() - use guillotine or guillotine-mini for full EVM execution",
        };
    }
    // Execute nested call via host
    // CALLCODE: like DELEGATECALL but caller is current address and value is the parameter
    const result = host.call({
        callType: "CALLCODE",
        target: targetAddress,
        value, // CALLCODE uses the value parameter
        gasLimit: availableGas,
        input: inputData,
        caller: frame.address, // CALLCODE: caller is current address (not original caller)
        isStatic: frame.isStatic,
        depth: frame.callDepth + 1,
    });
    // Store return data for RETURNDATASIZE/RETURNDATACOPY
    frame.returnData = result.output;
    // Copy output to memory at outOffset (up to outLength bytes)
    const copyLen = Math.min(outLen, result.output.length);
    for (let i = 0; i < copyLen; i++) {
        writeMemory(frame, outOff + i, /** @type {number} */ (result.output[i]));
    }
    // Refund unused gas
    const gasRefund = availableGas - result.gasUsed;
    if (gasRefund > 0n) {
        frame.gasRemaining += gasRefund;
    }
    // Add gas refunds from child
    if (result.gasRefund > 0n) {
        frame.gasRefunds = (frame.gasRefunds ?? 0n) + result.gasRefund;
    }
    // Collect logs from child
    if (result.logs && result.logs.length > 0) {
        frame.logs = frame.logs ?? [];
        frame.logs.push(...result.logs);
    }
    // Push success (1) or failure (0) to stack
    const pushErr = pushStack(frame, result.success ? 1n : 0n);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
