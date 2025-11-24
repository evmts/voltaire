import * as Address from "../../../primitives/Address/index.js";
// Transaction Gas Price: Calculate effective gas prices
import * as Transaction from "../../../primitives/Transaction/index.js";

// Legacy transaction - fixed gas price
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};
const legacyGasPrice = Transaction.getGasPrice(legacy);

// EIP-1559 transaction - dynamic fee market
const eip1559: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
	maxFeePerGas: 30_000_000_000n, // 30 gwei max
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Calculate effective gas price with different base fees
const baseFee1 = 15_000_000_000n; // 15 gwei (low congestion)
const effectiveGasPrice1 = Transaction.getGasPrice(eip1559, baseFee1);

const baseFee2 = 25_000_000_000n; // 25 gwei (medium congestion)
const effectiveGasPrice2 = Transaction.getGasPrice(eip1559, baseFee2);

const baseFee3 = 50_000_000_000n; // 50 gwei (high congestion)
const effectiveGasPrice3 = Transaction.getGasPrice(eip1559, baseFee3);
