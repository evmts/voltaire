import { Address, EventLog, Hash } from "voltaire";
// Event signature: keccak256("Approval(address,address,uint256)")
const APPROVAL_SIGNATURE = Hash(
	"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
);

// USDT contract
const usdtAddress = Address("0xdac17f958d2ee523a2206206994597c13d831ec7");

// User approving Uniswap V3 Router
const ownerAddress = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const spenderAddress = Hash(
	"0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3 Router
);

// Approval for max uint256 (unlimited approval)
const maxUint256Data = new Uint8Array(32);
maxUint256Data.fill(0xff);

const approvalLog = EventLog.create({
	address: usdtAddress,
	topics: [APPROVAL_SIGNATURE, ownerAddress, spenderAddress],
	data: maxUint256Data,
	blockNumber: 18600000n,
	transactionHash: Hash(
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	),
	logIndex: 3,
});

const signature = EventLog.getTopic0(approvalLog);

const [owner, spender] = EventLog.getIndexedTopics(approvalLog);

// Check if unlimited approval
const isMaxApproval = approvalLog.data.every((byte) => byte === 0xff);

if (isMaxApproval) {
} else {
	const dataView = new DataView(approvalLog.data.buffer);
	const value = dataView.getBigUint64(24, false);
}

// DEX router approvals
const uniswapV3Router = Hash(
	"0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564",
);
const uniswapV2Router = Hash(
	"0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d",
);
const sushiswapRouter = Hash(
	"0x000000000000000000000000d9e1ce17f2641f24ae83637ab66a2cca9c378b9f",
);

// Check if approval is for a known DEX
const isUniswapV3 = EventLog.matchesTopics(approvalLog, [
	APPROVAL_SIGNATURE,
	null,
	uniswapV3Router,
]);
const isUniswapV2 = EventLog.matchesTopics(approvalLog, [
	APPROVAL_SIGNATURE,
	null,
	uniswapV2Router,
]);
const isSushiswap = EventLog.matchesTopics(approvalLog, [
	APPROVAL_SIGNATURE,
	null,
	sushiswapRouter,
]);

const user1 = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const user2 = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);

const limitedApprovalData = new Uint8Array(32);
// 10,000 USDT (6 decimals) = 10000000000 = 0x2540BE400
limitedApprovalData[27] = 0x02;
limitedApprovalData[28] = 0x54;
limitedApprovalData[29] = 0x0b;
limitedApprovalData[30] = 0xe4;
limitedApprovalData[31] = 0x00;

const approvals = [
	approvalLog, // User 1 -> Uniswap V3 (unlimited)
	EventLog.create({
		address: usdtAddress,
		topics: [APPROVAL_SIGNATURE, user1, uniswapV2Router],
		data: limitedApprovalData,
		blockNumber: 18600001n,
	}), // User 1 -> Uniswap V2 (limited)
	EventLog.create({
		address: usdtAddress,
		topics: [APPROVAL_SIGNATURE, user2, uniswapV3Router],
		data: maxUint256Data,
		blockNumber: 18600002n,
	}), // User 2 -> Uniswap V3 (unlimited)
];

// Find all approvals for Uniswap V3
const v3Approvals = EventLog.filterLogs(approvals, {
	address: usdtAddress,
	topics: [APPROVAL_SIGNATURE, null, uniswapV3Router],
});

// Find all approvals from user 1
const user1Approvals = EventLog.filterLogs(approvals, {
	topics: [APPROVAL_SIGNATURE, user1, null],
});

// Find unlimited approvals
const unlimitedApprovals = approvals.filter((log) =>
	log.data.every((byte) => byte === 0xff),
);
approvals.forEach((log, i) => {
	const [o, s] = EventLog.getIndexedTopics(log);
	const isUnlimited = log.data.every((byte) => byte === 0xff);
});
