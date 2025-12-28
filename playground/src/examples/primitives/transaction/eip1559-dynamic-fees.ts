import { Address, Hex, Transaction } from "voltaire";
// EIP-1559 Transaction: Dynamic fee market with priority fees

// Create EIP-1559 transaction (most common type post-London fork)
const eip1559: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 12n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip to miner
	maxFeePerGas: 30_000_000_000n, // 30 gwei maximum willing to pay
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 500_000_000_000_000_000n, // 0.5 ETH
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Calculate effective gas price given current base fee
const baseFee = 20_000_000_000n; // 20 gwei from block
const effectiveGasPrice = Transaction.getGasPrice(eip1559, baseFee);

// Total max cost (reserved upfront)
const maxCost = eip1559.maxFeePerGas * eip1559.gasLimit + eip1559.value;

// Actual cost if all gas used
const actualCost = effectiveGasPrice * eip1559.gasLimit + eip1559.value;

// Refund
const refund = maxCost - actualCost;
