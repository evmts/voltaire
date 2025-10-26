import { encodeList } from "../../../native/primitives/rlp.js";

// Test data: various arrays
const testList1 = ["0x1234", new Uint8Array([1, 2, 3]), 42];
const testList2 = [1, 2, 3, 4, 5];
const testNestedList = ["0x42", ["0x43"], "0x12345678", []];

export function main(): void {
	encodeList(testList1);
	encodeList(testList2);
	encodeList(testNestedList);
}
