import { from } from "./from.js";
import { Address } from "../../primitives/Address/index.js";

/**
 * Create a test frame with sensible defaults
 *
 * @param {object} [options] - Optional overrides
 * @param {Uint8Array} [options.bytecode] - Bytecode to execute
 * @param {bigint} [options.gas] - Initial gas
 * @param {import("../../primitives/Address/BrandedAddress/BrandedAddress.js").BrandedAddress} [options.caller] - Caller address
 * @param {import("../../primitives/Address/BrandedAddress/BrandedAddress.js").BrandedAddress} [options.address] - Current address
 * @param {bigint} [options.value] - Value transferred
 * @param {Uint8Array} [options.calldata] - Call data
 * @param {boolean} [options.isStatic] - Static call flag
 * @returns {import("./BrandedFrame.js").BrandedFrame} Test frame instance
 */
export function createTestFrame(options = {}) {
	const defaultCaller = Address.from(
		"0x0000000000000000000000000000000000000001",
	);
	const defaultAddress = Address.from(
		"0x0000000000000000000000000000000000000002",
	);

	return from({
		bytecode: options.bytecode ?? new Uint8Array(0),
		gas: options.gas ?? 1000000n,
		caller: options.caller ?? defaultCaller,
		address: options.address ?? defaultAddress,
		value: options.value ?? 0n,
		calldata: options.calldata ?? new Uint8Array(0),
		isStatic: options.isStatic ?? false,
	});
}
