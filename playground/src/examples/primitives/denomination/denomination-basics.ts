import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Create Wei values
const smallWei = Wei.from(1000n);
const oneGweiInWei = Wei.from(1_000_000_000n);
const oneEtherInWei = Wei.from(1_000_000_000_000_000_000n);

// Create Gwei values (common for gas prices)
const lowGasPrice = Gwei.from(10n);
const normalGasPrice = Gwei.from(30n);
const highGasPrice = Gwei.from(100n);

// Create Ether values (human-readable)
const smallBalance = Ether.from(1n);
const largeBalance = Ether.from(1000n);

// Wei <-> Gwei
const weiValue = Wei.from(50_000_000_000n);
const asGwei = Wei.toGwei(weiValue);
const backToWei = Gwei.toWei(asGwei);

// Wei <-> Ether
const weiBalance = Wei.from(2_500_000_000_000_000_000n);
const asEther = Wei.toEther(weiBalance);
const backToWeiFromEther = Ether.toWei(asEther);

// Gwei <-> Ether
const gweiAmount = Gwei.from(5_000_000_000n);
const gweiAsEther = Gwei.toEther(gweiAmount);
const backToGwei = Ether.toGwei(gweiAsEther);

// Gas calculation
const gasPrice = Gwei.from(30n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint.from(gasUsed));
const gasCostEther = Wei.toEther(gasCostWei as Wei.Type);

// Balance conversion
const accountBalanceWei = Wei.from(15_750_000_000_000_000_000n);
const accountBalanceEther = Wei.toEther(accountBalanceWei);
