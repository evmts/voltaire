import { BlockHeader, Bytes, Bytes32 } from "@tevm/voltaire";
// Block N
const blockN = BlockHeader({
	parentHash: Bytes32.zero().fill(0x00),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x01),
	transactionsRoot: Bytes32.zero().fill(0x02),
	receiptsRoot: Bytes32.zero().fill(0x03),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 18000000n,
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1693903403n, // Sept 5, 2023 12:30:03 UTC
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 20000000000n,
});

// Block N+1 (12 seconds later - normal)
const blockN1 = BlockHeader({
	parentHash: Bytes32.zero().fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x02),
	transactionsRoot: Bytes32.zero().fill(0x03),
	receiptsRoot: Bytes32.zero().fill(0x04),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 18000001n,
	gasLimit: 30000000n,
	gasUsed: 16000000n,
	timestamp: 1693903415n, // +12 seconds
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 21000000000n,
});

const timeDiff = Number(blockN1.timestamp - blockN.timestamp);
const now = BigInt(Math.floor(Date.now() / 1000));
const tolerance = 15n; // 15 seconds tolerance
const expectedTime = blockN.timestamp + 12n;

// Vesting schedule
const vestingStart = 1693900000n;
const vestingDuration = 31536000n; // 1 year in seconds
const elapsed = blockN.timestamp - vestingStart;
const vestingProgress = (Number(elapsed) / Number(vestingDuration)) * 100;

// Time-locked withdrawal
const lockPeriod = 86400n; // 1 day
const depositTime = blockN.timestamp - 43200n; // Deposited 12 hours ago
const unlockTime = depositTime + lockPeriod;
const canWithdraw = blockN.timestamp >= unlockTime;

// Auction deadline
const auctionEnd = 1693910000n;
const auctionActive = blockN.timestamp < auctionEnd;
if (auctionActive) {
}
