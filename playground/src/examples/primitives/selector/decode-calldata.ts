import * as Selector from "../../../primitives/Selector/index.js";

// Example: Extracting and decoding function selectors from calldata

console.log("=== Extracting Selectors from Calldata ===\n");

console.log("Calldata structure: [4-byte selector][encoded parameters]\n");

console.log("--- ERC20 Transfer ---\n");

const transferCalldata =
	"0xa9059cbb" + // transfer(address,uint256)
	"000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e" + // to address
	"0000000000000000000000000000000000000000000000000de0b6b3a7640000"; // amount (1 ETH)

console.log(`Full calldata:`);
console.log(`  ${transferCalldata}\n`);

const transferSel = Selector.from(transferCalldata.slice(0, 10)); // "0x" + 8 hex chars
console.log(`Extracted selector: ${Selector.toHex(transferSel)}`);

const expectedTransfer = Selector.fromSignature("transfer(address,uint256)");
console.log(`Expected transfer:  ${Selector.toHex(expectedTransfer)}`);
console.log(`Match: ${Selector.equals(transferSel, expectedTransfer)}\n`);

console.log("--- ERC20 Approve ---\n");

const approveCalldata =
	"0x095ea7b3" + // approve(address,uint256)
	"0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d" + // spender (Uniswap router)
	"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; // amount (max uint256)

console.log(`Calldata: ${approveCalldata.slice(0, 40)}...`);

const approveSel = Selector.from(approveCalldata.slice(0, 10));
console.log(`Selector: ${Selector.toHex(approveSel)}`);
console.log(
	`Function: ${Selector.equals(approveSel, Selector.fromSignature("approve(address,uint256)")) ? "approve(address,uint256)" : "unknown"}\n`,
);

console.log("--- Uniswap V2 Swap ---\n");

const swapCalldata =
	"0x38ed1739" + // swapExactTokensForTokens
	"00000000000000000000000000000000000000000000000000038d7ea4c68000" + // amountIn
	"0000000000000000000000000000000000000000000000000000000000000001" + // amountOutMin
	"0000000000000000000000000000000000000000000000000000000000000080"; // path offset (truncated)

console.log(`Calldata: ${swapCalldata.slice(0, 40)}...`);

const swapSel = Selector.from(swapCalldata.slice(0, 10));
console.log(`Selector: ${Selector.toHex(swapSel)}`);

const expectedSwap = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);
console.log(
	`Match swapExactTokensForTokens: ${Selector.equals(swapSel, expectedSwap)}\n`,
);

console.log("--- NFT Safe Transfer ---\n");

const safeTransferCalldata =
	"0x42842e0e" + // safeTransferFrom(address,address,uint256)
	"000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e" + // from
	"0000000000000000000000005aaed59320b9eb3cd462ddbaefa21da757f30fbd" + // to
	"0000000000000000000000000000000000000000000000000000000000000001"; // tokenId

console.log(`Calldata: ${safeTransferCalldata.slice(0, 40)}...`);

const nftSel = Selector.from(safeTransferCalldata.slice(0, 10));
console.log(`Selector: ${Selector.toHex(nftSel)}`);

const expectedNftTransfer = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);
console.log(
	`Function: ${Selector.equals(nftSel, expectedNftTransfer) ? "safeTransferFrom(address,address,uint256)" : "unknown"}\n`,
);

console.log("=== Selector Dispatch Pattern ===\n");

function identifyFunction(calldata: string): string {
	if (calldata.length < 10) return "Invalid calldata";

	const sel = Selector.from(calldata.slice(0, 10));
	const selHex = Selector.toHex(sel);

	// Build lookup map
	const functionMap = new Map([
		[
			Selector.toHex(Selector.fromSignature("transfer(address,uint256)")),
			"transfer",
		],
		[
			Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
			"approve",
		],
		[
			Selector.toHex(
				Selector.fromSignature("transferFrom(address,address,uint256)"),
			),
			"transferFrom",
		],
		[
			Selector.toHex(
				Selector.fromSignature(
					"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
				),
			),
			"swapExactTokensForTokens",
		],
		[
			Selector.toHex(
				Selector.fromSignature("safeTransferFrom(address,address,uint256)"),
			),
			"safeTransferFrom",
		],
	]);

	return functionMap.get(selHex) ?? "Unknown function";
}

console.log("Identifying functions from calldata:\n");

const testCalls = [
	transferCalldata,
	approveCalldata,
	swapCalldata,
	safeTransferCalldata,
];

for (const calldata of testCalls) {
	const sel = Selector.from(calldata.slice(0, 10));
	console.log(`${Selector.toHex(sel)} -> ${identifyFunction(calldata)}`);
}

console.log("\n--- Invalid Calldata ---\n");

try {
	const shortCalldata = "0xabcd"; // Only 2 bytes
	Selector.from(shortCalldata);
} catch (e) {
	console.log(`Short calldata error: ${e.message}`);
}

try {
	const emptyCalldata = "0x";
	Selector.from(emptyCalldata);
} catch (e) {
	console.log(`Empty calldata error: ${e.message}`);
}

console.log("\n=== Practical Usage ===\n");
console.log("Transaction monitoring:");
console.log("  1. Extract first 4 bytes from tx.data");
console.log("  2. Compare against known selectors");
console.log("  3. Route to appropriate decoder");
console.log("  4. Decode parameters based on function signature\n");

console.log("Smart contract dispatch:");
console.log("  Solidity uses selector to route calls:");
console.log("  bytes4 selector = bytes4(msg.data);");
console.log("  if (selector == 0xa9059cbb) { /* transfer */ }");
console.log("  if (selector == 0x095ea7b3) { /* approve */ }\n");
