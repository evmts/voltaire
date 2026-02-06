/**
 * Complete fee market state for a block
 */
export type FeeMarketType = {
    /** Gas used in block */
    gasUsed: bigint;
    /** Gas limit of block */
    gasLimit: bigint;
    /** Base fee per gas (wei) */
    baseFee: bigint;
    /** Excess blob gas accumulated */
    excessBlobGas: bigint;
    /** Blob gas used in block */
    blobGasUsed: bigint;
};
//# sourceMappingURL=FeeMarketType.d.ts.map