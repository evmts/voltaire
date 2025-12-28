import {
	Address,
	BlockBody,
	Bytes,
	Bytes32,
	Transaction,
} from "@tevm/voltaire";
// Transaction Filtering: Filter and analyze block body transactions

// Create diverse set of transactions
const targetAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

const transactions: Transaction.Any[] = [
	// ETH transfers to target
	{
		type: Transaction.Type.Legacy,
		nonce: 0n,
		gasPrice: 20_000_000_000n,
		gasLimit: 21_000n,
		to: targetAddress,
		value: 1_000_000_000_000_000_000n,
		data: Bytes.zero(0),
		v: 27n,
		r: Bytes32.zero(),
		s: Bytes32.zero(),
	},
	// Contract interactions (with data)
	{
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 1n,
		maxPriorityFeePerGas: 2_000_000_000n,
		maxFeePerGas: 30_000_000_000n,
		gasLimit: 100_000n,
		to: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
		value: 0n,
		data: Bytes([0xa9, 0x05, 0x9c, 0xbb]), // Method signature
		accessList: [],
		yParity: 0,
		r: Bytes32.zero(),
		s: Bytes32.zero(),
	},
	// Another to target
	{
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 2n,
		maxPriorityFeePerGas: 3_000_000_000n,
		maxFeePerGas: 35_000_000_000n,
		gasLimit: 50_000n,
		to: targetAddress,
		value: 500_000_000_000_000_000n,
		data: Bytes.zero(0),
		accessList: [],
		yParity: 1,
		r: Bytes32.zero(),
		s: Bytes32.zero(),
	},
	// Contract creation
	{
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 3n,
		maxPriorityFeePerGas: 2_000_000_000n,
		maxFeePerGas: 30_000_000_000n,
		gasLimit: 2_000_000n,
		to: null,
		value: 0n,
		data: Bytes.zero(500),
		accessList: [],
		yParity: 0,
		r: Bytes32.zero(),
		s: Bytes32.zero(),
	},
	// Zero value transaction
	{
		type: Transaction.Type.Legacy,
		nonce: 4n,
		gasPrice: 15_000_000_000n,
		gasLimit: 21_000n,
		to: Address("0x5aAed5937020b9EB3Cd462dDbAefA21DA757f30f"),
		value: 0n,
		data: Bytes.zero(0),
		v: 27n,
		r: Bytes32.zero(),
		s: Bytes32.zero(),
	},
];

const body = BlockBody({
	transactions,
	ommers: [],
});
const toTarget = body.transactions.filter(
	(tx) => tx.to && Address.equals(tx.to, targetAddress),
);
const contractCreations = body.transactions.filter((tx) => tx.to === null);
const legacyTxs = body.transactions.filter(
	(tx) => tx.type === Transaction.Type.Legacy,
);
const eip1559Txs = body.transactions.filter(
	(tx) => tx.type === Transaction.Type.EIP1559,
);
const valueTransfers = body.transactions.filter((tx) => tx.value > 0n);
const zeroValue = body.transactions.filter((tx) => tx.value === 0n);
const withData = body.transactions.filter((tx) => tx.data.length > 0);
const simpleTransfers = body.transactions.filter((tx) => tx.data.length === 0);
const highValue = body.transactions.filter(
	(tx) => tx.value >= 1_000_000_000_000_000_000n,
);
highValue.forEach((tx, i) => {});
