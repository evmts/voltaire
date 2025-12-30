import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
} from "@tevm/voltaire";

// Multicall3 contract (deployed on most networks)
const multicall3 = Address.fromHex(
	"0xcA11bde05977b3631167028862bE2a173976CA11",
);

// Token contracts
const usdc = Address.fromHex("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const weth = Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const dai = Address.fromHex("0x6B175474E89094C44Da98b954EescdecAD3F9e6Db");

// User address
const privateKey = Secp256k1.randomPrivateKey();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const userAddress = Address.fromPublicKey(publicKey);

// Helper to encode function calls
function encodeCall(selector: string, params: Uint8Array[]): Uint8Array {
	const selectorBytes = Keccak256.selector(selector);
	let totalLength = 4;
	for (const param of params) {
		totalLength += param.length;
	}

	const encoded = new Uint8Array(totalLength);
	encoded.set(selectorBytes, 0);

	let offset = 4;
	for (const param of params) {
		encoded.set(param, offset);
		offset += param.length;
	}

	return encoded;
}

// Helper to pad address to 32 bytes
function padAddress(addr: Uint8Array): Uint8Array {
	const padded = new Uint8Array(32);
	padded.set(addr, 12);
	return padded;
}

const balanceOfCalls = [
	{
		target: usdc,
		callData: encodeCall("balanceOf(address)", [padAddress(userAddress)]),
	},
	{
		target: weth,
		callData: encodeCall("balanceOf(address)", [padAddress(userAddress)]),
	},
	{
		target: dai,
		callData: encodeCall("balanceOf(address)", [padAddress(userAddress)]),
	},
];

for (let i = 0; i < balanceOfCalls.length; i++) {
	const call = balanceOfCalls[i];
}

// Multicall3.aggregate(Call[] calldata calls) returns (uint256 blockNumber, bytes[] memory returnData)
// Call struct: { address target, bytes calldata }

// Struct encoding:
// - offset to calls array (32 bytes)
// - array length (32 bytes)
// - for each call:
//   - offset to call data (32 bytes)
// - for each call:
//   - target address (32 bytes padded)
//   - offset to callData within struct (32 bytes)
//   - callData length (32 bytes)
//   - callData (padded to 32 bytes)

function encodeMulticall3Aggregate(
	calls: Array<{ target: Uint8Array; callData: Uint8Array }>,
): Uint8Array {
	const selector = Keccak256.selector("aggregate((address,bytes)[])");

	// Calculate sizes
	const numCalls = calls.length;

	// Build the encoded data dynamically
	const parts: Uint8Array[] = [];

	// Selector
	parts.push(selector);

	// Offset to array (always 0x20 = 32)
	const arrayOffset = new Uint8Array(32);
	arrayOffset[31] = 0x20;
	parts.push(arrayOffset);

	// Array length
	const arrayLength = new Uint8Array(32);
	arrayLength[31] = numCalls;
	parts.push(arrayLength);

	// Calculate offsets for each struct
	// Each struct starts at: numCalls * 32 (for offset pointers) + sum of previous struct sizes
	const structOffsets: number[] = [];
	let currentOffset = numCalls * 32;

	for (const call of calls) {
		structOffsets.push(currentOffset);
		// Struct size: target (32) + callData offset (32) + callData length (32) + padded callData
		const paddedDataLen = Math.ceil(call.callData.length / 32) * 32;
		currentOffset += 32 + 32 + 32 + paddedDataLen;
	}

	// Offset pointers
	for (const offset of structOffsets) {
		const offsetBytes = new Uint8Array(32);
		offsetBytes[31] = offset & 0xff;
		offsetBytes[30] = (offset >> 8) & 0xff;
		parts.push(offsetBytes);
	}

	// Struct data
	for (const call of calls) {
		// Target address (padded)
		parts.push(padAddress(call.target));

		// Offset to callData within struct (always 0x40 = 64, after target and this offset)
		const dataOffset = new Uint8Array(32);
		dataOffset[31] = 0x40;
		parts.push(dataOffset);

		// callData length
		const dataLength = new Uint8Array(32);
		dataLength[31] = call.callData.length & 0xff;
		dataLength[30] = (call.callData.length >> 8) & 0xff;
		parts.push(dataLength);

		// callData (padded)
		const paddedData = new Uint8Array(
			Math.ceil(call.callData.length / 32) * 32,
		);
		paddedData.set(call.callData, 0);
		parts.push(paddedData);
	}

	// Combine all parts
	let totalLength = 0;
	for (const part of parts) {
		totalLength += part.length;
	}

	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
}

const aggregateCalldata = encodeMulticall3Aggregate(balanceOfCalls);

// tryAggregate(bool requireSuccess, Call[] calldata calls)
// returns (Result[] memory returnData)
// Result struct: { bool success, bytes returnData }

function encodeTryAggregate(
	requireSuccess: boolean,
	calls: Array<{ target: Uint8Array; callData: Uint8Array }>,
): Uint8Array {
	const selector = Keccak256.selector("tryAggregate(bool,(address,bytes)[])");

	const parts: Uint8Array[] = [];
	parts.push(selector);

	// requireSuccess (bool as uint256)
	const requireSuccessBytes = new Uint8Array(32);
	if (requireSuccess) {
		requireSuccessBytes[31] = 1;
	}
	parts.push(requireSuccessBytes);

	// Offset to calls array (0x40 = 64, after selector + requireSuccess)
	const arrayOffset = new Uint8Array(32);
	arrayOffset[31] = 0x40;
	parts.push(arrayOffset);

	// Array length
	const arrayLength = new Uint8Array(32);
	arrayLength[31] = calls.length;
	parts.push(arrayLength);

	// Struct offsets and data (simplified encoding)
	let currentOffset = calls.length * 32;
	const structOffsets: number[] = [];

	for (const call of calls) {
		structOffsets.push(currentOffset);
		const paddedDataLen = Math.ceil(call.callData.length / 32) * 32;
		currentOffset += 32 + 32 + 32 + paddedDataLen;
	}

	for (const offset of structOffsets) {
		const offsetBytes = new Uint8Array(32);
		offsetBytes[31] = offset & 0xff;
		offsetBytes[30] = (offset >> 8) & 0xff;
		parts.push(offsetBytes);
	}

	for (const call of calls) {
		parts.push(padAddress(call.target));
		const dataOffset = new Uint8Array(32);
		dataOffset[31] = 0x40;
		parts.push(dataOffset);
		const dataLength = new Uint8Array(32);
		dataLength[31] = call.callData.length & 0xff;
		parts.push(dataLength);
		const paddedData = new Uint8Array(
			Math.ceil(call.callData.length / 32) * 32,
		);
		paddedData.set(call.callData, 0);
		parts.push(paddedData);
	}

	let totalLength = 0;
	for (const part of parts) {
		totalLength += part.length;
	}

	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
}

const tryAggregateCalldata = encodeTryAggregate(false, balanceOfCalls);

// Uniswap V3 Router uses multicall with deadline
const uniswapRouter = Address.fromHex(
	"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
);

// Example: Approve + Swap in one transaction
// Router multicall(bytes[] data) - each bytes is an encoded function call

// Call 1: selfPermit (gasless approval using ERC-2612)
const selfPermitData = encodeCall(
	"selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)",
	[
		padAddress(usdc), // token
		new Uint8Array(32).fill(0xff), // value (max)
		new Uint8Array(32), // deadline
		new Uint8Array(32), // v
		new Uint8Array(32), // r
		new Uint8Array(32), // s
	],
);

// Call 2: exactInputSingle swap
const swapData = encodeCall(
	"exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
	[
		padAddress(usdc), // tokenIn
		padAddress(weth), // tokenOut
		new Uint8Array(32), // fee (would be encoded)
		padAddress(userAddress), // recipient
		new Uint8Array(32), // amountIn
		new Uint8Array(32), // amountOutMinimum
		new Uint8Array(32), // sqrtPriceLimitX96
	],
);

// Encode router multicall(bytes[] data)
function encodeRouterMulticall(calls: Uint8Array[]): Uint8Array {
	const selector = Keccak256.selector("multicall(bytes[])");

	const parts: Uint8Array[] = [];
	parts.push(selector);

	// Offset to array
	const arrayOffset = new Uint8Array(32);
	arrayOffset[31] = 0x20;
	parts.push(arrayOffset);

	// Array length
	const arrayLength = new Uint8Array(32);
	arrayLength[31] = calls.length;
	parts.push(arrayLength);

	// Offsets and data
	let currentOffset = calls.length * 32;
	for (const call of calls) {
		const offsetBytes = new Uint8Array(32);
		offsetBytes[31] = currentOffset & 0xff;
		offsetBytes[30] = (currentOffset >> 8) & 0xff;
		parts.push(offsetBytes);
		const paddedLen = 32 + Math.ceil(call.length / 32) * 32;
		currentOffset += paddedLen;
	}

	for (const call of calls) {
		const lenBytes = new Uint8Array(32);
		lenBytes[31] = call.length & 0xff;
		lenBytes[30] = (call.length >> 8) & 0xff;
		parts.push(lenBytes);
		const padded = new Uint8Array(Math.ceil(call.length / 32) * 32);
		padded.set(call, 0);
		parts.push(padded);
	}

	let totalLength = 0;
	for (const part of parts) {
		totalLength += part.length;
	}

	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
}

const routerMulticallData = encodeRouterMulticall([selfPermitData, swapData]);

const multicallTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 300_000n, // Higher for multicall
	to: multicall3,
	value: 0n,
	data: aggregateCalldata,
	accessList: [],
};

// Sign
const signingHash = Transaction.getSigningHash(multicallTx);
const signature = Secp256k1.sign(signingHash, privateKey);

const signedTx: Transaction.EIP1559 = {
	...multicallTx,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27),
};

const serialized = Transaction.serialize(signedTx);

// Example response parsing (simulated)
function decodeAggregateResponse(response: Uint8Array): {
	blockNumber: bigint;
	returnData: Uint8Array[];
} {
	// Response: uint256 blockNumber, bytes[] returnData
	// First 32 bytes: block number
	let blockNumber = 0n;
	for (let i = 0; i < 32; i++) {
		blockNumber = (blockNumber << 8n) + BigInt(response[i]);
	}

	// Offset to array at bytes 32-64
	// Array length at that offset
	// Then offsets and data for each bytes

	return {
		blockNumber,
		returnData: [], // Would parse actual return data
	};
}
