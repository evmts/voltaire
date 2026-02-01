/**
 * Convert bigint address to 20-byte Uint8Array
 * @param {bigint} addr
 * @returns {import("../../../primitives/Address/AddressType.js").AddressType}
 */
export function bigintToAddress(addr) {
	const bytes = new Uint8Array(20);
	let val = addr;
	for (let i = 19; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val >>= 8n;
	}
	return /** @type {import("../../../primitives/Address/AddressType.js").AddressType} */ (
		bytes
	);
}
