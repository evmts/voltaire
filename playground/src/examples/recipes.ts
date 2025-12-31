// Recipes examples - imported as raw strings
// These demonstrate common Ethereum workflows with Voltaire

import accessListCreation from "./recipes/access-list-creation.ts?raw";
import blobTransaction from "./recipes/blob-transaction.ts?raw";
import contractDeployment from "./recipes/contract-deployment.ts?raw";
import messageSigning from "./recipes/message-signing.ts?raw";
import multicallEncoding from "./recipes/multicall-encoding.ts?raw";
import nftTransfer from "./recipes/nft-transfer.ts?raw";
import permitSigning from "./recipes/permit-signing.ts?raw";
import tokenTransfer from "./recipes/token-transfer.ts?raw";
import transactionSigning from "./recipes/transaction-signing.ts?raw";
import typedDataSigning from "./recipes/typed-data-signing.ts?raw";
import walletGeneration from "./recipes/wallet-generation.ts?raw";

export const recipesExamples: Record<string, string> = {
	"wallet-generation.ts": walletGeneration,
	"message-signing.ts": messageSigning,
	"typed-data-signing.ts": typedDataSigning,
	"permit-signing.ts": permitSigning,
	"transaction-signing.ts": transactionSigning,
	"token-transfer.ts": tokenTransfer,
	"nft-transfer.ts": nftTransfer,
	"contract-deployment.ts": contractDeployment,
	"multicall-encoding.ts": multicallEncoding,
	"access-list-creation.ts": accessListCreation,
	"blob-transaction.ts": blobTransaction,
};
