import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
// Create Wei values
const smallWei = Wei(1000n);
const oneGweiInWei = Wei(1_000_000_000n);
const oneEtherInWei = Wei(1_000_000_000_000_000_000n);

// Create Gwei values (common for gas prices)
const lowGasPrice = Gwei(10n);
const normalGasPrice = Gwei(30n);
const highGasPrice = Gwei(100n);

// Create Ether values (human-readable)
const smallBalance = Ether(1n);
const largeBalance = Ether(1000n);

// Wei <-> Gwei
const weiValue = Wei(50_000_000_000n);
const asGwei = Wei.toGwei(weiValue);
const backToWei = Gwei.toWei(asGwei);

// Wei <-> Ether
const weiBalance = Wei(2_500_000_000_000_000_000n);
const asEther = Wei.toEther(weiBalance);
const backToWeiFromEther = Ether.toWei(asEther);

// Gwei <-> Ether
const gweiAmount = Gwei(5_000_000_000n);
const gweiAsEther = Gwei.toEther(gweiAmount);
const backToGwei = Ether.toGwei(gweiAsEther);

// Gas calculation
const gasPrice = Gwei(30n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint(gasUsed));
const gasCostEther = Wei.toEther(gasCostWei as Wei.Type);

// Balance conversion
const accountBalanceWei = Wei(15_750_000_000_000_000_000n);
const accountBalanceEther = Wei.toEther(accountBalanceWei);
