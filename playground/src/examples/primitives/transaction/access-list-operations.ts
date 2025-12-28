import { Address, Hash, Hex, Transaction, Bytes, Bytes32 } from "@tevm/voltaire";
// Access List Operations: Work with transaction access lists

// Transaction with access list
const txWithAccessList: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 50_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 0n,
	data: Bytes.zero(0),
	accessList: [
		{
			address: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
			storageKeys: [
				Hash(`0x${"00".repeat(32)}`),
				Hash(`0x${"01".repeat(32)}`),
			],
		},
		{
			address: Address("0x1234567890123456789012345678901234567890"),
			storageKeys: [Hash(`0x${"02".repeat(32)}`)],
		},
	],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// Check if transaction has access list
const hasAccessList = Transaction.hasAccessList(txWithAccessList);

// Get access list
const accessList = Transaction.getAccessList(txWithAccessList);

// Iterate through access list
accessList.forEach((entry, index) => {
	entry.storageKeys.forEach((key, keyIndex) => {});
});

// Transaction without access list
const txWithoutAccessList: Transaction.Legacy = {
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
const hasAccessList2 = Transaction.hasAccessList(txWithoutAccessList);

const accessList2 = Transaction.getAccessList(txWithoutAccessList);
let accessListGasCost = 0n;
accessList.forEach((entry) => {
	accessListGasCost += 2400n; // Address cost
	accessListGasCost += BigInt(entry.storageKeys.length) * 1900n; // Storage key costs
});
