import { hexlify } from "ethers";

export function main(): void {
	// Create arrays filled with specific byte values
	const bytes0 = new Uint8Array(32).fill(0x00);
	hexlify(bytes0);

	const bytesFF = new Uint8Array(32).fill(0xff);
	hexlify(bytesFF);

	const bytes42 = new Uint8Array(32).fill(0x42);
	hexlify(bytes42);
}
