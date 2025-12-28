import { type Uint256Type } from "voltaire";
import { TransactionStatus } from "voltaire";

// Simple transfer: 21000 gas (base cost)
const simpleTransfer = TransactionStatus.success(21000n as Uint256Type);

// ERC20 transfer: ~65000 gas typical
const erc20Transfer = TransactionStatus.success(65000n as Uint256Type);

// Complex contract interaction: higher gas
const complexCall = TransactionStatus.success(250000n as Uint256Type);

// NFT mint: can vary widely
const nftMint = TransactionStatus.success(180000n as Uint256Type);

const transactions = [
	{ name: "Simple Transfer", status: simpleTransfer },
	{ name: "ERC20 Transfer", status: erc20Transfer },
	{ name: "Complex Call", status: complexCall },
	{ name: "NFT Mint", status: nftMint },
];

for (const tx of transactions) {
	if (TransactionStatus.isSuccess(tx.status)) {
	}
}

function validateSuccess(status: typeof simpleTransfer) {
	if (!TransactionStatus.isSuccess(status)) {
		throw new Error("Expected success status");
	}

	// Check gas bounds
	if (status.gasUsed < 21000n) {
	}

	if (status.gasUsed > 30000000n) {
	}
}

validateSuccess(simpleTransfer);
