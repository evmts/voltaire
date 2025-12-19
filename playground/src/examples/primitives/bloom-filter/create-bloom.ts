import * as BloomFilter from "voltaire/primitives/BloomFilter";
import {
	BITS,
	DEFAULT_HASH_COUNT,
	SIZE,
} from "voltaire/primitives/BloomFilter";
const ethBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

// Create from hex string
const hexStr =
	"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
const fromHex = BloomFilter.fromHex(hexStr, BITS, DEFAULT_HASH_COUNT);
const testBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
const item = new TextEncoder().encode("test");

function countSetBits(filter: Uint8Array): number {
	let count = 0;
	for (let i = 0; i < filter.length; i++) {
		let byte = filter[i] as number;
		while (byte > 0) {
			count += byte & 1;
			byte >>= 1;
		}
	}
	return count;
}

const beforeBits = countSetBits(testBloom);
BloomFilter.add(testBloom, item);
const afterBits = countSetBits(testBloom);
const bitsSet = afterBits - beforeBits;
