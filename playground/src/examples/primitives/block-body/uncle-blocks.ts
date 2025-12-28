import { Address, BlockBody, Transaction, type UncleType, Bytes, Bytes32 } from "@tevm/voltaire";
// Uncle Blocks: Working with ommers/uncle blocks (pre-merge)

// Create sample uncle block header
const uncle1: UncleType = {
	parentHash: Bytes32.zero(),
	ommersHash: Bytes32.zero(),
	beneficiary: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	stateRoot: Bytes32.zero(),
	transactionsRoot: Bytes32.zero(),
	receiptsRoot: Bytes32.zero(),
	logsBloom: Bytes.zero(256),
	difficulty: 15_000_000_000_000n,
	number: 12345678n,
	gasLimit: 30_000_000n,
	gasUsed: 21_000_000n,
	timestamp: 1620000000n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
};

const uncle2: UncleType = {
	parentHash: Bytes32.zero(),
	ommersHash: Bytes32.zero(),
	beneficiary: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	stateRoot: Bytes32.zero(),
	transactionsRoot: Bytes32.zero(),
	receiptsRoot: Bytes32.zero(),
	logsBloom: Bytes.zero(256),
	difficulty: 14_800_000_000_000n,
	number: 12345679n,
	gasLimit: 30_000_000n,
	gasUsed: 18_500_000n,
	timestamp: 1620000013n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
};

// Transaction
const tx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: Bytes.zero(0),
	v: 27n,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// Block with uncle blocks
const blockWithUncles = BlockBody({
	transactions: [tx],
	ommers: [uncle1, uncle2],
});
blockWithUncles.ommers.forEach((uncle, i) => {});
const postMergeBlock = BlockBody({
	transactions: [tx],
	ommers: [], // Always empty post-merge
});
