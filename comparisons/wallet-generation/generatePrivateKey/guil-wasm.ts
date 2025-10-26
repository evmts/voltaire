import { generatePrivateKey } from "../../../src/typescript/wasm/primitives/wallet.wasm";

export function main(): string {
	const privateKey = generatePrivateKey();
	return `0x${Buffer.from(privateKey).toString("hex")}`;
}
