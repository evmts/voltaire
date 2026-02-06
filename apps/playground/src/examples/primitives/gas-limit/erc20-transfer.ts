import { Gas } from "@tevm/voltaire";
// Standard ERC20 transfer typically costs ~65000 gas
const erc20TransferGas = Gas.gasLimitFrom(65000);
const ethGas = 21000;
const erc20Gas = 65000;
const overhead = erc20Gas - ethGas;
// Some tokens have additional logic
const usdc = Gas.gasLimitFrom(65000);

const usdtFirst = Gas.gasLimitFrom(75000); // USDT has extra checks

const taxToken = Gas.gasLimitFrom(100000); // Tax tokens need more
// Always add buffer for safety
const safeLimit = Gas.gasLimitFrom(80000); // 65000 + buffer
