import { BlockHeader } from "voltaire";
// Empty block
const emptyBlock = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x00),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x01),
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421", // Empty
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421", // Empty
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 18000000n,
	gasLimit: 30000000n,
	gasUsed: 0n, // Empty block
	timestamp: 1693903403n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 20000000000n,
});

// Half-full block (target)
const targetBlock = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x02),
	transactionsRoot: new Uint8Array(32).fill(0x03),
	receiptsRoot: new Uint8Array(32).fill(0x04),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 18000001n,
	gasLimit: 30000000n,
	gasUsed: 15000000n, // 50% (EIP-1559 target)
	timestamp: 1693903415n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 20000000000n,
});

const targetUtilization =
	(Number(targetBlock.gasUsed) / Number(targetBlock.gasLimit)) * 100;

// Full block
const fullBlock = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x02),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x03),
	transactionsRoot: new Uint8Array(32).fill(0x04),
	receiptsRoot: new Uint8Array(32).fill(0x05),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 18000002n,
	gasLimit: 30000000n,
	gasUsed: 29998543n, // 99.995% (essentially full)
	timestamp: 1693903427n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 25000000000n,
});

const fullUtilization =
	(Number(fullBlock.gasUsed) / Number(fullBlock.gasLimit)) * 100;
const remainingGas = Number(fullBlock.gasLimit - fullBlock.gasUsed);

const simpleTransferCost = 21000n; // ETH transfer
const erc20TransferCost = 65000n; // Token transfer
const uniswapSwapCost = 150000n; // Uniswap V2 swap

const maxIncrease = (fullBlock.gasLimit * 1n) / 1024n;
const maxDecrease = (fullBlock.gasLimit * 1n) / 1024n;
