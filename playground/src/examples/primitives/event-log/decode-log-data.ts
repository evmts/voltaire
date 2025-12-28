import { Address, EventLog, Hash } from "voltaire";
const TRANSFER_SIG = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
const from = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const to = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);

// 1000.5 USDC (6 decimals) = 1000500000 = 0x3B9B0290
const valueData = new Uint8Array(32);
valueData[28] = 0x3b;
valueData[29] = 0x9b;
valueData[30] = 0x02;
valueData[31] = 0x90;

const transferLog = EventLog.create({
	address: Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
	topics: [TRANSFER_SIG, from, to],
	data: valueData,
	blockNumber: 19200000n,
});

// Decode single uint256
function decodeUint256(data: Uint8Array): bigint {
	const view = new DataView(data.buffer);
	// Read as two 32-bit parts and combine
	const hi = view.getBigUint64(0, false);
	const lo = view.getBigUint64(24, false);
	return lo; // Simplified - just read last 8 bytes for demo
}

const value = decodeUint256(transferLog.data);

const SWAP_SIG = Hash(
	"0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
);
const sender = Hash(
	"0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d",
);
const recipient = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);

// 4 uint256 values: amount0In, amount1In, amount0Out, amount1Out
const swapData = new Uint8Array(128);
// amount0In = 0
// amount1In = 1000 USDC
swapData[60] = 0x3b;
swapData[61] = 0x9a;
swapData[62] = 0xca;
swapData[63] = 0x00;
// amount0Out = 0.5 WETH
swapData[86] = 0x06;
swapData[87] = 0xf0;
swapData[88] = 0x5b;
swapData[89] = 0x59;
swapData[90] = 0xd3;
swapData[91] = 0xb2;
swapData[94] = 0x00;
swapData[95] = 0x00;
// amount1Out = 0

const swapLog = EventLog.create({
	address: Address("0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"),
	topics: [SWAP_SIG, sender, recipient],
	data: swapData,
	blockNumber: 19200001n,
});

// Decode multiple uint256 values
function decodeMultipleUint256(data: Uint8Array, count: number): bigint[] {
	const results: bigint[] = [];
	const view = new DataView(data.buffer);
	for (let i = 0; i < count; i++) {
		const offset = i * 32 + 24; // Each uint256 is 32 bytes, read last 8
		results.push(view.getBigUint64(offset, false));
	}
	return results;
}

const [amount0In, amount1In, amount0Out, amount1Out] = decodeMultipleUint256(
	swapLog.data,
	4,
);

// Custom event: Deposited(uint256 amount, address indexed sender, address beneficiary)
const DEPOSITED_SIG = Hash(
	"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
);
const senderIndexed = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);

// Data: uint256 amount + address beneficiary
const depositData = new Uint8Array(64); // 2 slots
// Amount: 500 tokens
depositData[31] = 0xff; // 255
depositData[30] = 0x01; // 511 total
// Beneficiary address (last 20 bytes of second slot)
const beneficiaryBytes = new Uint8Array([
	0xd8, 0xda, 0x6b, 0xf2, 0x69, 0x64, 0xaf, 0x9d, 0x7e, 0xed, 0x9e, 0x03, 0xe5,
	0x34, 0x15, 0xd3, 0x7a, 0xa9, 0x60, 0x45,
]);
depositData.set(beneficiaryBytes, 44); // Offset 32 + 12

const depositLog = EventLog.create({
	address: Address("0x0000000000000000000000000000000000000001"),
	topics: [DEPOSITED_SIG, senderIndexed],
	data: depositData,
	blockNumber: 19200002n,
});

// Decode uint256 + address
const depositView = new DataView(depositLog.data.buffer);
const amount = depositView.getBigUint64(24, false);
const beneficiaryData = depositLog.data.slice(44, 64); // Last 20 bytes of slot 2

// StatusChanged(address indexed user, bool active)
const STATUS_SIG = Hash(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);
const user = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);

const statusData = new Uint8Array(32);
statusData[31] = 1; // true

const statusLog = EventLog.create({
	address: Address("0x0000000000000000000000000000000000000002"),
	topics: [STATUS_SIG, user],
	data: statusData,
	blockNumber: 19200003n,
});

const statusView = new DataView(statusLog.data.buffer);
const active = statusView.getUint8(31) !== 0;

// EventEmitted(uint256 id, address target, bool success)
const EVENT_SIG = Hash(
	"0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
);

const multiData = new Uint8Array(96); // 3 slots
// ID: 12345
multiData[30] = 0x30;
multiData[31] = 0x39;
// Target address (20 bytes)
const targetBytes = new Uint8Array([
	0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62, 0xdd, 0xba, 0xef,
	0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd,
]);
multiData.set(targetBytes, 44);
// Success: true
multiData[95] = 1;

const multiLog = EventLog.create({
	address: Address("0x0000000000000000000000000000000000000003"),
	topics: [EVENT_SIG],
	data: multiData,
	blockNumber: 19200004n,
});

const multiView = new DataView(multiLog.data.buffer);
const id = multiView.getBigUint64(24, false);
const targetData = multiLog.data.slice(44, 64);
const success = multiView.getUint8(95) !== 0;
