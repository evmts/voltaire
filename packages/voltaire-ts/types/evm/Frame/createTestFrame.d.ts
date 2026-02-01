/**
 * Create a test frame with sensible defaults
 *
 * @param {object} [options] - Optional overrides
 * @param {Uint8Array} [options.bytecode] - Bytecode to execute
 * @param {bigint} [options.gas] - Initial gas
 * @param {import("../../primitives/Address/AddressType.js").AddressType} [options.caller] - Caller address
 * @param {import("../../primitives/Address/AddressType.js").AddressType} [options.address] - Current address
 * @param {bigint} [options.value] - Value transferred
 * @param {Uint8Array} [options.calldata] - Call data
 * @param {boolean} [options.isStatic] - Static call flag
 * @returns {import("./FrameType.js").BrandedFrame} Test frame instance
 */
export function createTestFrame(options?: {
    bytecode?: Uint8Array<ArrayBufferLike> | undefined;
    gas?: bigint | undefined;
    caller?: import("../../primitives/Address/AddressType.js").AddressType | undefined;
    address?: import("../../primitives/Address/AddressType.js").AddressType | undefined;
    value?: bigint | undefined;
    calldata?: Uint8Array<ArrayBufferLike> | undefined;
    isStatic?: boolean | undefined;
}): import("./FrameType.js").BrandedFrame;
//# sourceMappingURL=createTestFrame.d.ts.map