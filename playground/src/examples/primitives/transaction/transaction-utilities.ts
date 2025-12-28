import { Address, Transaction, Bytes, Bytes32 } from "@tevm/voltaire";
// Transaction Utilities: Helper functions for transaction analysis

// Contract creation transaction (to is null)
const contractCreation: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 500_000n,
	to: null, // null indicates contract creation
	value: 0n,
	data: Bytes([0x60, 0x80, 0x60, 0x40]), // Contract bytecode
	accessList: [],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// Contract call transaction
const contractCall: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 100_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 0n,
	data: Bytes([0xa9, 0x05, 0x9c, 0xbb]), // Function selector
	accessList: [],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};
const recipient = Transaction.getRecipient(contractCall);
if (recipient) {
}

// Simple ETH transfer
const ethTransfer: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: Bytes.zero(0), // Empty data
	accessList: [],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};
