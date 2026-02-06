import { Hardfork } from "@tevm/voltaire";
// Hardfork Basics - Core concepts of Ethereum hardforks

// Hardforks represent protocol upgrades in Ethereum's history
// Each fork adds new features, changes gas costs, or fixes issues

// 1. Creating hardforks from strings
const cancun = Hardfork.fromString("cancun");
const merge = Hardfork.fromString("merge");
const paris = Hardfork.fromString("paris"); // Alias for merge
const london = Hardfork.fromString("london");

// 2. All available hardforks
const allForks = Hardfork.allNames();

// 6. Hardfork ranges
const modernForks = Hardfork.range(Hardfork.LONDON, Hardfork.CANCUN);

// 7. Min/max operations
const latest = Hardfork.max([Hardfork.BERLIN, Hardfork.CANCUN]);
const earliest = Hardfork.min([Hardfork.LONDON, Hardfork.MERGE]);
