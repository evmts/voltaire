import { toRlp } from "viem";

// Test data: various arrays
// viem toRlp handles arrays automatically
const testList1 = ["0x1234", new Uint8Array([1, 2, 3]), "0x2a"];
const testList2 = ["0x01", "0x02", "0x03", "0x04", "0x05"];
const testNestedList = ["0x42", ["0x43"], "0x12345678", []];

export function main(): void {
	toRlp(testList1);
	toRlp(testList2);
	toRlp(testNestedList);
}
