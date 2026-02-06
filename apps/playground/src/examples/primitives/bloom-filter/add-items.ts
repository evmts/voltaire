import { BloomFilter, Bytes, Bytes32 } from "@tevm/voltaire";

const bloom = BloomFilter.create(2048, 3);
const address = Bytes([
	0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62, 0xdd, 0xba, 0xef,
	0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd,
]);
BloomFilter.add(bloom, address);
const topic = Bytes32.zero();
topic[0] = 0xdd;
topic[1] = 0xf2;
topic[2] = 0x52;
topic[3] = 0xad;
BloomFilter.add(bloom, topic);
const indexedAddr = Bytes32.zero();
// Left-padded with 12 zeros, address in last 20 bytes
for (let i = 0; i < 20; i++) {
	indexedAddr[12 + i] = i + 1;
}
BloomFilter.add(bloom, indexedAddr);
const beforeDensity = BloomFilter.density(bloom);
for (let i = 0; i < 100; i++) {
	const addr = Bytes.zero(20);
	addr[0] = i;
	addr[19] = i;
	BloomFilter.add(bloom, addr);
}
const afterDensity = BloomFilter.density(bloom);

// Check false positive
const notAdded = Bytes.repeat(0xff, 20);
const maybePresent = BloomFilter.contains(bloom, notAdded);
if (maybePresent) {
} else {
}
