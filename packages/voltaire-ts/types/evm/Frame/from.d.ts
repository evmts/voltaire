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
export function from({ bytecode, gas, caller, address, value, calldata, isStatic, stack, gasRemaining, }: {
    bytecode?: Uint8Array<ArrayBufferLike> | undefined;
    gas?: bigint | undefined;
    caller?: import("../../primitives/Address/AddressType.js").AddressType | undefined;
    address?: import("../../primitives/Address/AddressType.js").AddressType | undefined;
    value?: bigint | undefined;
    calldata?: Uint8Array<ArrayBufferLike> | undefined;
    isStatic?: boolean | undefined;
    stack?: bigint[] | undefined;
    gasRemaining?: bigint | undefined;
}): import("./FrameType.js").BrandedFrame;
//# sourceMappingURL=from.d.ts.map