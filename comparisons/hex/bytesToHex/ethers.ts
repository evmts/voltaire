import { hexlify } from "ethers";

const testBytes = new Uint8Array([
	0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
]);

export function main(): void {
	hexlify(testBytes);
}
