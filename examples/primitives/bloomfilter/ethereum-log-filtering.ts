// Simulate Ethereum log filtering with bloom filters
import {
	BITS,
	BloomFilter,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

// Simulate Ethereum address (20 bytes)
function createAddress(name: string): Uint8Array {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(name);
	const address = new Uint8Array(20);
	address.set(bytes.slice(0, Math.min(20, bytes.length)));
	return address;
}

// Simulate event topic hash (32 bytes)
function createTopic(signature: string): Uint8Array {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(signature);
	const topic = new Uint8Array(32);
	topic.set(bytes.slice(0, Math.min(32, bytes.length)));
	return topic;
}

// Simulate an Ethereum log
interface Log {
	address: Uint8Array;
	topics: Uint8Array[];
	data: string;
}

// Build bloom filter for a block's logs
function buildBlockBloom(logs: Log[]): typeof BloomFilter.prototype {
	const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

	for (const log of logs) {
		// Add address
		filter.add(log.address);

		// Add each topic
		for (const topic of log.topics) {
			filter.add(topic);
		}
	}

	return filter;
}

// Create some simulated logs
const usdcAddress = createAddress("USDC");
const daiAddress = createAddress("DAI");
const transferTopic = createTopic("Transfer(address,address,uint256)");
const approvalTopic = createTopic("Approval(address,address,uint256)");

// Block 1000 logs
const block1000Logs: Log[] = [
	{ address: usdcAddress, topics: [transferTopic], data: "0x..." },
	{ address: daiAddress, topics: [transferTopic], data: "0x..." },
];

// Block 1001 logs
const block1001Logs: Log[] = [
	{ address: usdcAddress, topics: [approvalTopic], data: "0x..." },
];

// Block 1002 logs (empty)
const block1002Logs: Log[] = [];
const block1000Bloom = buildBlockBloom(block1000Logs);
const block1001Bloom = buildBlockBloom(block1001Logs);
const block1002Bloom = buildBlockBloom(block1002Logs);

const targetAddress = usdcAddress;
const targetTopic = transferTopic;

let candidateBlocks: number[] = [];

if (
	block1000Bloom.contains(targetAddress) &&
	block1000Bloom.contains(targetTopic)
) {
	candidateBlocks.push(1000);
}

if (
	block1001Bloom.contains(targetAddress) &&
	block1001Bloom.contains(targetTopic)
) {
	candidateBlocks.push(1001);
}

if (
	block1002Bloom.contains(targetAddress) &&
	block1002Bloom.contains(targetTopic)
) {
	candidateBlocks.push(1002);
}
candidateBlocks = [];

if (block1000Bloom.contains(daiAddress)) {
	candidateBlocks.push(1000);
}

if (block1001Bloom.contains(daiAddress)) {
	candidateBlocks.push(1001);
}

if (block1002Bloom.contains(daiAddress)) {
	candidateBlocks.push(1002);
}

if (candidateBlocks.length === 0) {
}
const totalBlocks = 3;
const blocksScanned = candidateBlocks.length;
const blocksSkipped = totalBlocks - blocksScanned;
const rangeBloom = block1000Bloom.merge(block1001Bloom).merge(block1002Bloom);

const wethAddress = createAddress("WETH");
if (!rangeBloom.contains(wethAddress)) {
} else {
}
