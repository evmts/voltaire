import type { brand } from "../../brand.js";
/**
 * ValidatorIndex type
 *
 * Represents a validator's index in the beacon state registry.
 * Each validator has a unique, immutable index assigned when they activate.
 *
 * @see https://voltaire.tevm.sh/primitives/validator-index for ValidatorIndex documentation
 * @see https://github.com/ethereum/consensus-specs for Consensus specifications
 * @since 0.0.0
 */
export type ValidatorIndexType = number & {
    readonly [brand]: "ValidatorIndex";
};
//# sourceMappingURL=ValidatorIndexType.d.ts.map