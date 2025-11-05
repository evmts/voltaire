/**
 * Branded Hardfork type
 *
 * Hardfork is a branded string type that represents Ethereum protocol upgrades.
 * Each hardfork represents a protocol upgrade that changes EVM behavior,
 * gas costs, or adds new features.
 */
export type BrandedHardfork = string & {
	readonly __tag: "Hardfork";
};
