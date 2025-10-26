import {
	Address,
	calculateCreateAddress,
} from "../../../wasm/primitives/address.js";

const sender = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
const nonce = 42n;

export function main(): void {
	const contractAddress = calculateCreateAddress(sender, nonce);
}
