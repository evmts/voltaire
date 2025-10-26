import { Address } from "../../../src/typescript/native/primitives/address.native.js";

const testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const address = Address.fromHex(testAddress);

export function main(): void {
	const checksummed = address.toChecksumHex();
}
