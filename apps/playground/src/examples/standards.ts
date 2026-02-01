// Standards examples - imported as raw strings
// These demonstrate ERC standard interactions with Voltaire

// ERC-20
import erc20Basics from "./standards/erc20/erc20-basics.ts?raw";
import erc20Allowance from "./standards/erc20/allowance.ts?raw";
import erc20Approve from "./standards/erc20/approve.ts?raw";
import erc20BalanceOf from "./standards/erc20/balance-of.ts?raw";
import erc20TransferFrom from "./standards/erc20/transfer-from.ts?raw";
import erc20Transfer from "./standards/erc20/transfer.ts?raw";

// ERC-721
import erc721Basics from "./standards/erc721/erc721-basics.ts?raw";
import erc721Approve from "./standards/erc721/approve.ts?raw";
import erc721OwnerOf from "./standards/erc721/owner-of.ts?raw";
import erc721SafeTransfer from "./standards/erc721/safe-transfer.ts?raw";
import erc721Transfer from "./standards/erc721/transfer.ts?raw";

// ERC-1155
import erc1155Basics from "./standards/erc1155/erc1155-basics.ts?raw";
import erc1155BalanceOf from "./standards/erc1155/balance-of.ts?raw";
import erc1155BatchBalance from "./standards/erc1155/batch-balance.ts?raw";
import erc1155BatchTransfer from "./standards/erc1155/batch-transfer.ts?raw";
import erc1155SafeTransfer from "./standards/erc1155/safe-transfer.ts?raw";

export const standardsExamples: Record<string, string> = {
	// ERC-20 Token Standard
	"erc20-basics.ts": erc20Basics,
	"erc20-balance-of.ts": erc20BalanceOf,
	"erc20-transfer.ts": erc20Transfer,
	"erc20-approve.ts": erc20Approve,
	"erc20-allowance.ts": erc20Allowance,
	"erc20-transfer-from.ts": erc20TransferFrom,

	// ERC-721 NFT Standard
	"erc721-basics.ts": erc721Basics,
	"erc721-owner-of.ts": erc721OwnerOf,
	"erc721-transfer.ts": erc721Transfer,
	"erc721-safe-transfer.ts": erc721SafeTransfer,
	"erc721-approve.ts": erc721Approve,

	// ERC-1155 Multi-Token Standard
	"erc1155-basics.ts": erc1155Basics,
	"erc1155-balance-of.ts": erc1155BalanceOf,
	"erc1155-batch-balance.ts": erc1155BatchBalance,
	"erc1155-safe-transfer.ts": erc1155SafeTransfer,
	"erc1155-batch-transfer.ts": erc1155BatchTransfer,
};
