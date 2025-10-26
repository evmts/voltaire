import { PrivateKeySignerImpl } from "../../../src/typescript/native/crypto/signers/private-key-signer.js";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): void {
	PrivateKeySignerImpl.fromPrivateKey({ privateKey: testPrivateKey });
}
