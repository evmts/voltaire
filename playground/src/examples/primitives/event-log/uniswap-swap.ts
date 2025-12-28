import { Address, EventLog, Hash } from "voltaire";
// Event signature: keccak256("Swap(address,uint256,uint256,uint256,uint256,address)")
const SWAP_SIGNATURE = Hash(
	"0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
);

// USDC/WETH pair on Uniswap V2
const pairAddress = Address("0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc");

// Sender (router) and recipient
const senderAddress = Hash(
	"0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
);
const recipientAddress = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);

// Swap data: trading USDC for WETH
// amount0In: 0 (no USDC in)
// amount1In: 1000 USDC (6 decimals) = 1000000000 = 0x3B9ACA00
// amount0Out: 0.5 WETH (18 decimals) = 500000000000000000 = 0x06F05B59D3B20000
// amount1Out: 0 (no USDC out)
const swapData = new Uint8Array(128); // 4 uint256 values = 128 bytes

// amount0In (32 bytes) - 0
// already zero

// amount1In (32 bytes) - 1000 USDC
swapData[60] = 0x3b;
swapData[61] = 0x9a;
swapData[62] = 0xca;
swapData[63] = 0x00;

// amount0Out (32 bytes) - 0.5 WETH
swapData[86] = 0x06;
swapData[87] = 0xf0;
swapData[88] = 0x5b;
swapData[89] = 0x59;
swapData[90] = 0xd3;
swapData[91] = 0xb2;
swapData[94] = 0x00;
swapData[95] = 0x00;

// amount1Out (32 bytes) - 0
// already zero

const swapLog = EventLog.create({
	address: pairAddress,
	topics: [SWAP_SIGNATURE, senderAddress, recipientAddress],
	data: swapData,
	blockNumber: 18800000n,
	transactionHash: Hash(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	),
	logIndex: 12,
});

const signature = EventLog.getTopic0(swapLog);

const [sender, recipient] = EventLog.getIndexedTopics(swapLog);

// Decode amounts from data field
const dataView = new DataView(swapLog.data.buffer);

const amount0In = dataView.getBigUint64(24, false);
const amount1In = dataView.getBigUint64(56, false);
const amount0Out = dataView.getBigUint64(88, false);
const amount1Out = dataView.getBigUint64(120, false);

// Determine swap direction
const isToken0ToToken1 = amount0In > 0n && amount1Out > 0n;
const isToken1ToToken0 = amount1In > 0n && amount0Out > 0n;

if (isToken1ToToken0) {
	const price = Number(amount1In) / Number(amount0Out);
}

const user1 = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const user2 = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const router = Hash(
	"0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d",
);

// Helper to create swap data
function createSwapData(
	amt0In: bigint,
	amt1In: bigint,
	amt0Out: bigint,
	amt1Out: bigint,
): Uint8Array {
	const data = new Uint8Array(128);
	const view = new DataView(data.buffer);
	view.setBigUint64(24, amt0In, false);
	view.setBigUint64(56, amt1In, false);
	view.setBigUint64(88, amt0Out, false);
	view.setBigUint64(120, amt1Out, false);
	return data;
}

const swaps = [
	EventLog.create({
		address: pairAddress,
		topics: [SWAP_SIGNATURE, router, user1],
		data: createSwapData(0n, 500_000_000n, 250_000_000_000_000_000n, 0n),
		blockNumber: 18800000n,
	}), // User1: USDC -> WETH
	EventLog.create({
		address: pairAddress,
		topics: [SWAP_SIGNATURE, router, user2],
		data: createSwapData(100_000_000_000_000_000n, 0n, 0n, 200_000_000n),
		blockNumber: 18800001n,
	}), // User2: WETH -> USDC
	EventLog.create({
		address: pairAddress,
		topics: [SWAP_SIGNATURE, router, user1],
		data: createSwapData(0n, 1_000_000_000n, 500_000_000_000_000_000n, 0n),
		blockNumber: 18800002n,
	}), // User1: USDC -> WETH again
];

// Filter swaps by recipient
const user1Swaps = EventLog.filterLogs(swaps, {
	topics: [SWAP_SIGNATURE, null, user1],
});

const user2Swaps = EventLog.filterLogs(swaps, {
	topics: [SWAP_SIGNATURE, null, user2],
});

// Filter by sender (router)
const routerSwaps = EventLog.filterLogs(swaps, {
	topics: [SWAP_SIGNATURE, router, null],
});
const sorted = EventLog.sortLogs(swaps);
sorted.forEach((log, i) => {
	const [s, r] = EventLog.getIndexedTopics(log);
	const view = new DataView(log.data.buffer);
	const amt0In = view.getBigUint64(24, false);
	const amt1In = view.getBigUint64(56, false);
	const amt0Out = view.getBigUint64(88, false);
	const amt1Out = view.getBigUint64(120, false);

	const direction =
		amt1In > 0n ? "USDC -> WETH" : amt0In > 0n ? "WETH -> USDC" : "Unknown";
});
