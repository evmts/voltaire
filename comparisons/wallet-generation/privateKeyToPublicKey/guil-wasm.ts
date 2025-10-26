import { secp256k1PubkeyFromPrivate } from "../../../src/typescript/wasm/primitives/signature.wasm";

// Test private key - DO NOT use in production
const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): string {
	const privateKeyBytes = new Uint8Array(Buffer.from(testPrivateKey.slice(2), "hex"));
	const publicKeyBytes = secp256k1PubkeyFromPrivate(privateKeyBytes);
	return `0x${Buffer.from(publicKeyBytes).toString("hex")}`;
}
