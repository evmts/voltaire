/**
 * Hardfork Constants
 *
 * Each hardfork represents a protocol upgrade that changes EVM behavior,
 * gas costs, or adds new features. Hardforks build upon previous ones
 * while adding improvements.
 *
 * @typedef {import('./HardforkType.js').HardforkType} HardforkType
 */

/** @type {HardforkType} Original Ethereum launch (July 2015). Base EVM with fundamental opcodes. */
export const FRONTIER = /** @type {HardforkType} */ ("frontier");

/** @type {HardforkType} First planned hardfork (March 2016). Added DELEGATECALL and fixed critical issues. */
export const HOMESTEAD = /** @type {HardforkType} */ ("homestead");

/** @type {HardforkType} Emergency fork for DAO hack (July 2016). No EVM changes, only state modifications. */
export const DAO = /** @type {HardforkType} */ ("dao");

/** @type {HardforkType} Gas repricing fork (October 2016). EIP-150: Increased gas costs for IO-heavy operations. */
export const TANGERINE_WHISTLE = /** @type {HardforkType} */ (
	"tangerinewhistle"
);

/** @type {HardforkType} State cleaning fork (November 2016). EIP-161: Removed empty accounts. */
export const SPURIOUS_DRAGON = /** @type {HardforkType} */ ("spuriousdragon");

/** @type {HardforkType} Major feature fork (October 2017). Added REVERT, RETURNDATASIZE, RETURNDATACOPY, STATICCALL. */
export const BYZANTIUM = /** @type {HardforkType} */ ("byzantium");

/** @type {HardforkType} Efficiency improvements (February 2019). Added CREATE2, shift opcodes, EXTCODEHASH. */
export const CONSTANTINOPLE = /** @type {HardforkType} */ ("constantinople");

/** @type {HardforkType} Quick fix fork (February 2019). Removed EIP-1283 due to reentrancy concerns. */
export const PETERSBURG = /** @type {HardforkType} */ ("petersburg");

/** @type {HardforkType} Gas optimization fork (December 2019). EIP-2200: Rebalanced SSTORE costs. Added CHAINID and SELFBALANCE. */
export const ISTANBUL = /** @type {HardforkType} */ ("istanbul");

/** @type {HardforkType} Difficulty bomb delay (January 2020). No EVM changes. */
export const MUIR_GLACIER = /** @type {HardforkType} */ ("muirglacier");

/** @type {HardforkType} Access list fork (April 2021). EIP-2929: Gas cost for cold/warm access. EIP-2930: Optional access lists. */
export const BERLIN = /** @type {HardforkType} */ ("berlin");

/** @type {HardforkType} Fee market reform (August 2021). EIP-1559: Base fee and new transaction types. Added BASEFEE opcode. */
export const LONDON = /** @type {HardforkType} */ ("london");

/** @type {HardforkType} Difficulty bomb delay (December 2021). No EVM changes. */
export const ARROW_GLACIER = /** @type {HardforkType} */ ("arrowglacier");

/** @type {HardforkType} Difficulty bomb delay (June 2022). No EVM changes. */
export const GRAY_GLACIER = /** @type {HardforkType} */ ("grayglacier");

/** @type {HardforkType} Proof of Stake transition (September 2022). Replaced DIFFICULTY with PREVRANDAO. */
export const MERGE = /** @type {HardforkType} */ ("merge");

/** @type {HardforkType} Withdrawal enabling fork (April 2023). EIP-3855: PUSH0 opcode. */
export const SHANGHAI = /** @type {HardforkType} */ ("shanghai");

/** @type {HardforkType} Proto-danksharding fork (March 2024). EIP-4844: Blob transactions. EIP-1153: Transient storage (TLOAD/TSTORE). EIP-5656: MCOPY opcode. */
export const CANCUN = /** @type {HardforkType} */ ("cancun");

/** @type {HardforkType} Prague-Electra fork (May 2025). EIP-2537: BLS12-381 precompiles. EIP-7702: Set EOA account code for one transaction. */
export const PRAGUE = /** @type {HardforkType} */ ("prague");

/** @type {HardforkType} Osaka fork (TBD). EIP-7883: ModExp gas increase. */
export const OSAKA = /** @type {HardforkType} */ ("osaka");

/**
 * Default hardfork for new chains.
 * Set to latest stable fork (currently PRAGUE).
 *
 * @type {HardforkType}
 */
export const DEFAULT = PRAGUE;

/**
 * Hardfork ordering for version comparison
 * @internal
 */
export const HARDFORK_ORDER = [
	FRONTIER,
	HOMESTEAD,
	DAO,
	TANGERINE_WHISTLE,
	SPURIOUS_DRAGON,
	BYZANTIUM,
	CONSTANTINOPLE,
	PETERSBURG,
	ISTANBUL,
	MUIR_GLACIER,
	BERLIN,
	LONDON,
	ARROW_GLACIER,
	GRAY_GLACIER,
	MERGE,
	SHANGHAI,
	CANCUN,
	PRAGUE,
	OSAKA,
];

/**
 * Hardfork name to hardfork mapping for string parsing
 * @internal
 */
export const NAME_TO_HARDFORK = {
	frontier: FRONTIER,
	homestead: HOMESTEAD,
	dao: DAO,
	tangerinewhistle: TANGERINE_WHISTLE,
	spuriousdragon: SPURIOUS_DRAGON,
	byzantium: BYZANTIUM,
	constantinople: CONSTANTINOPLE,
	petersburg: PETERSBURG,
	constantinoplefix: PETERSBURG, // alias
	istanbul: ISTANBUL,
	muirglacier: MUIR_GLACIER,
	berlin: BERLIN,
	london: LONDON,
	arrowglacier: ARROW_GLACIER,
	grayglacier: GRAY_GLACIER,
	merge: MERGE,
	paris: MERGE, // alias
	shanghai: SHANGHAI,
	cancun: CANCUN,
	prague: PRAGUE,
	osaka: OSAKA,
};
