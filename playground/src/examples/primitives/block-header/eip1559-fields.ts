import { BlockHeader, Bytes, Bytes32 } from "@tevm/voltaire";
// Block N: Normal usage
const blockN = BlockHeader({
	parentHash: Bytes32.zero().fill(0x00),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x01),
	transactionsRoot: Bytes32.zero().fill(0x02),
	receiptsRoot: Bytes32.zero().fill(0x03),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 18000000n,
	gasLimit: 30000000n,
	gasUsed: 15000000n, // 50% utilization (target)
	timestamp: 1693903403n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 20000000000n, // 20 gwei
});

// Block N+1: High demand (base fee increases)
const blockN1 = BlockHeader({
	parentHash: Bytes32.zero().fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x02),
	transactionsRoot: Bytes32.zero().fill(0x03),
	receiptsRoot: Bytes32.zero().fill(0x04),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 18000001n,
	gasLimit: 30000000n,
	gasUsed: 29500000n, // 98% utilization (high demand)
	timestamp: 1693903415n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 22500000000n, // 22.5 gwei (12.5% increase)
});

// Block N+2: Low demand (base fee decreases)
const blockN2 = BlockHeader({
	parentHash: Bytes32.zero().fill(0x02),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x03),
	transactionsRoot: Bytes32.zero().fill(0x04),
	receiptsRoot: Bytes32.zero().fill(0x05),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 18000002n,
	gasLimit: 30000000n,
	gasUsed: 5000000n, // 16.7% utilization (low demand)
	timestamp: 1693903427n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 19687500000n, // 19.6875 gwei (12.5% decrease)
});
