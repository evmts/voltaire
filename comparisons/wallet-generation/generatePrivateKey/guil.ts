import { secp256k1 } from "@noble/curves/secp256k1.js";

export function main(): string {
	const privateKey = secp256k1.utils.randomSecretKey();
	return `0x${Buffer.from(privateKey).toString("hex")}`;
}
