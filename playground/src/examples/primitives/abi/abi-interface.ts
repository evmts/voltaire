import * as ABI from "../../../primitives/ABI/index.js";

// Example: Create ERC20 interface
const erc20 = ABI.Interface.erc20();

// Example: Encode using interface
const transferData = ABI.Function.encodeParams(erc20.functions.transfer, [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	100n,
]);

// Example: Get selector from interface
const transferSelector = ABI.Function.getSelector(erc20.functions.transfer);

// Example: Get event signature from interface
const transferEventSig = ABI.Event.getSelector(erc20.events.Transfer);
