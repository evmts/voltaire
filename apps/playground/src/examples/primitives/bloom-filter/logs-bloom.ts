import { BloomFilter, Bytes, Bytes32 } from "@tevm/voltaire";

// ERC20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
// Event signature hash: keccak256("Transfer(address,address,uint256)")
const transferEventSig = Bytes([
	0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68, 0xfc,
	0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16, 0x28, 0xf5,
	0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
]);

// Contract address (20 bytes)
const contractAddr = Bytes([
	0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a, 0x2e,
	0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48,
]);

// From address (indexed, padded to 32 bytes)
const fromAddr = Bytes32.zero();
fromAddr.set(
	Bytes([
		0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62, 0xdd, 0xba,
		0xef, 0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd,
	]),
	12,
);

// To address (indexed, padded to 32 bytes)
const toAddr = Bytes32.zero();
toAddr.set(
	Bytes([
		0x70, 0x99, 0x7b, 0x70, 0x83, 0x7e, 0xdc, 0xf3, 0x9c, 0x09, 0x98, 0xf0,
		0x4f, 0x42, 0xa4, 0x95, 0x92, 0x37, 0x04, 0xf5,
	]),
	12,
);
const logBloom = BloomFilter.create(2048, 3);

// Add contract address and topics to bloom
BloomFilter.add(logBloom, contractAddr);
BloomFilter.add(logBloom, transferEventSig); // topic[0]
BloomFilter.add(logBloom, fromAddr); // topic[1]
BloomFilter.add(logBloom, toAddr); // topic[2]
const multiLogBloom = BloomFilter.create(2048, 3);

// Simulate 5 Transfer events
for (let i = 0; i < 5; i++) {
	const from = Bytes32.zero();
	from.set(Bytes.zero(20).fill(i + 1), 12);
	const to = Bytes32.zero();
	to.set(Bytes.zero(20).fill(i + 10), 12);

	BloomFilter.add(multiLogBloom, contractAddr); // Same contract
	BloomFilter.add(multiLogBloom, transferEventSig); // Same event
	BloomFilter.add(multiLogBloom, from);
	BloomFilter.add(multiLogBloom, to);
}
const searchAddr = Bytes32.zero();
searchAddr.set(Bytes.repeat(3, 20), 12);

// Different event type
const approvalSig = Bytes32.zero().fill(0xab);
