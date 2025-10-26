import { Address } from "../../../src/typescript/native/primitives/address.native.js";

const sender = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
const nonce = 42;

export function main(): void {
	const contractAddress = Address.calculateCreateAddress(sender, nonce);
}
