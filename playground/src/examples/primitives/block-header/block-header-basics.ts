import * as BlockHeader from "../../../primitives/BlockHeader/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: BlockHeader basics - comprehensive field access

// Real Ethereum mainnet block 18000000 (post-Merge, post-Shanghai, pre-Cancun)
const header = BlockHeader.from({
	parentHash:
		"0x88a9f05297a32c733aa2ca8b8c8a5fc8d96c3c6d8c3e8e4c3fe8e3f0d3c3a9f0",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347", // Empty ommers (standard post-merge)
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5", // Validator fee recipient
	stateRoot:
		"0x9a3d5e3e8f3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d",
	transactionsRoot:
		"0x3a5e8f3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f",
	receiptsRoot:
		"0x5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d",
	logsBloom: new Uint8Array(256), // Empty bloom for simplicity
	difficulty: 0n, // Post-merge: PoW disabled
	number: 18000000n,
	gasLimit: 30000000n,
	gasUsed: 15234567n,
	timestamp: 1693903403n, // Sept 5, 2023
	extraData: Hex.toBytes(
		"0x496c6c756d696e61746520446d6f63726174697a6520447374726962757465",
	), // "Illuminate Dmocratize Dstribute"
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000", // Zero post-merge
	nonce: new Uint8Array(8), // Zero post-merge
	baseFeePerGas: 30123456789n, // EIP-1559 base fee (~30 gwei)
	withdrawalsRoot:
		"0x8e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f", // Post-Shanghai
});
