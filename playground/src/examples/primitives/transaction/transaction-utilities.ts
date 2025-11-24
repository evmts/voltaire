import * as Address from "../../../primitives/Address/index.js";
// Transaction Utilities: Helper functions for transaction analysis
import * as Transaction from "../../../primitives/Transaction/index.js";

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
	data: new Uint8Array([0x60, 0x80, 0x60, 0x40]), // Contract bytecode
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Contract call transaction
const contractCall: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 0n,
	data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]), // Function selector
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
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
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(), // Empty data
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};
