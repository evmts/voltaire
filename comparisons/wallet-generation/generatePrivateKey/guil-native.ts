import { generatePrivateKey } from "../../../src/typescript/native/primitives/wallet.native";

export function main(): string {
	const privateKey = generatePrivateKey();
	return `0x${Buffer.from(privateKey).toString("hex")}`;
}
