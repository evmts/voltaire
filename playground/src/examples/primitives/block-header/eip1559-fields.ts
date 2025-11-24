import * as BlockHeader from "../../../primitives/BlockHeader/index.js";

// Block N: Normal usage
const blockN = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x00),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x01),
	transactionsRoot: new Uint8Array(32).fill(0x02),
	receiptsRoot: new Uint8Array(32).fill(0x03),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 18000000n,
	gasLimit: 30000000n,
	gasUsed: 15000000n, // 50% utilization (target)
	timestamp: 1693903403n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 20000000000n, // 20 gwei
});

// Block N+1: High demand (base fee increases)
const blockN1 = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x02),
	transactionsRoot: new Uint8Array(32).fill(0x03),
	receiptsRoot: new Uint8Array(32).fill(0x04),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 18000001n,
	gasLimit: 30000000n,
	gasUsed: 29500000n, // 98% utilization (high demand)
	timestamp: 1693903415n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 22500000000n, // 22.5 gwei (12.5% increase)
});

// Block N+2: Low demand (base fee decreases)
const blockN2 = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x02),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x03),
	transactionsRoot: new Uint8Array(32).fill(0x04),
	receiptsRoot: new Uint8Array(32).fill(0x05),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 18000002n,
	gasLimit: 30000000n,
	gasUsed: 5000000n, // 16.7% utilization (low demand)
	timestamp: 1693903427n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 19687500000n, // 19.6875 gwei (12.5% decrease)
});
