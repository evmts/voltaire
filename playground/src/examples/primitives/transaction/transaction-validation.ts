import { Address, Transaction, Bytes, Bytes32 } from "@tevm/voltaire";
// Transaction Validation: Validate transaction fields

// Create transaction to validate
const tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: Bytes.zero(0),
	accessList: [],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// Validate gas price
try {
	Transaction.validateGasPrice(tx);
} catch (error) {}

// Validate gas limit
try {
	Transaction.validateGasLimit(tx);
} catch (error) {}

// Validate nonce
try {
	Transaction.validateNonce(tx);
} catch (error) {}

// Validate value
try {
	Transaction.validateValue(tx);
} catch (error) {}

// Validate chain ID
try {
	Transaction.validateChainId(tx);
} catch (error) {}
