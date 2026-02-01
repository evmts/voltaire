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
export const FRONTIER: HardforkType;
/** @type {HardforkType} First planned hardfork (March 2016). Added DELEGATECALL and fixed critical issues. */
export const HOMESTEAD: HardforkType;
/** @type {HardforkType} Emergency fork for DAO hack (July 2016). No EVM changes, only state modifications. */
export const DAO: HardforkType;
/** @type {HardforkType} Gas repricing fork (October 2016). EIP-150: Increased gas costs for IO-heavy operations. */
export const TANGERINE_WHISTLE: HardforkType;
/** @type {HardforkType} State cleaning fork (November 2016). EIP-161: Removed empty accounts. */
export const SPURIOUS_DRAGON: HardforkType;
/** @type {HardforkType} Major feature fork (October 2017). Added REVERT, RETURNDATASIZE, RETURNDATACOPY, STATICCALL. */
export const BYZANTIUM: HardforkType;
/** @type {HardforkType} Efficiency improvements (February 2019). Added CREATE2, shift opcodes, EXTCODEHASH. */
export const CONSTANTINOPLE: HardforkType;
/** @type {HardforkType} Quick fix fork (February 2019). Removed EIP-1283 due to reentrancy concerns. */
export const PETERSBURG: HardforkType;
/** @type {HardforkType} Gas optimization fork (December 2019). EIP-2200: Rebalanced SSTORE costs. Added CHAINID and SELFBALANCE. */
export const ISTANBUL: HardforkType;
/** @type {HardforkType} Difficulty bomb delay (January 2020). No EVM changes. */
export const MUIR_GLACIER: HardforkType;
/** @type {HardforkType} Access list fork (April 2021). EIP-2929: Gas cost for cold/warm access. EIP-2930: Optional access lists. */
export const BERLIN: HardforkType;
/** @type {HardforkType} Fee market reform (August 2021). EIP-1559: Base fee and new transaction types. Added BASEFEE opcode. */
export const LONDON: HardforkType;
/** @type {HardforkType} Difficulty bomb delay (December 2021). No EVM changes. */
export const ARROW_GLACIER: HardforkType;
/** @type {HardforkType} Difficulty bomb delay (June 2022). No EVM changes. */
export const GRAY_GLACIER: HardforkType;
/** @type {HardforkType} Proof of Stake transition (September 2022). Replaced DIFFICULTY with PREVRANDAO. */
export const MERGE: HardforkType;
/** @type {HardforkType} Withdrawal enabling fork (April 2023). EIP-3855: PUSH0 opcode. */
export const SHANGHAI: HardforkType;
/** @type {HardforkType} Proto-danksharding fork (March 2024). EIP-4844: Blob transactions. EIP-1153: Transient storage (TLOAD/TSTORE). EIP-5656: MCOPY opcode. */
export const CANCUN: HardforkType;
/** @type {HardforkType} Prague-Electra fork (May 2025). EIP-2537: BLS12-381 precompiles. EIP-7702: Set EOA account code for one transaction. */
export const PRAGUE: HardforkType;
/** @type {HardforkType} Osaka fork (TBD). EIP-7883: ModExp gas increase. */
export const OSAKA: HardforkType;
/**
 * Default hardfork for new chains.
 * Set to latest stable fork (currently PRAGUE).
 *
 * @type {HardforkType}
 */
export const DEFAULT: HardforkType;
/**
 * Hardfork ordering for version comparison
 * @internal
 */
export const HARDFORK_ORDER: import("./HardforkType.js").HardforkType[];
export namespace NAME_TO_HARDFORK {
    export { FRONTIER as frontier };
    export { HOMESTEAD as homestead };
    export { DAO as dao };
    export { TANGERINE_WHISTLE as tangerinewhistle };
    export { SPURIOUS_DRAGON as spuriousdragon };
    export { BYZANTIUM as byzantium };
    export { CONSTANTINOPLE as constantinople };
    export { PETERSBURG as petersburg };
    export { PETERSBURG as constantinoplefix };
    export { ISTANBUL as istanbul };
    export { MUIR_GLACIER as muirglacier };
    export { BERLIN as berlin };
    export { LONDON as london };
    export { ARROW_GLACIER as arrowglacier };
    export { GRAY_GLACIER as grayglacier };
    export { MERGE as merge };
    export { MERGE as paris };
    export { SHANGHAI as shanghai };
    export { CANCUN as cancun };
    export { PRAGUE as prague };
    export { OSAKA as osaka };
}
/**
 * Hardfork Constants
 *
 * Each hardfork represents a protocol upgrade that changes EVM behavior,
 * gas costs, or adds new features. Hardforks build upon previous ones
 * while adding improvements.
 */
export type HardforkType = import("./HardforkType.js").HardforkType;
//# sourceMappingURL=constants.d.ts.map