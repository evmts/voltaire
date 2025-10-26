import { encodeRlp } from "ethers";

// Test data: strings, numbers, and byte arrays
const testString = "0x1234";
const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
const testNumber = "0x2a"; // ethers expects hex strings

export function main(): void {
	encodeRlp(testString);
	encodeRlp(testBytes);
	encodeRlp(testNumber);
}
