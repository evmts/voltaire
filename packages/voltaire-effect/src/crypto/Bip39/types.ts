/**
 * Valid entropy strengths for BIP-39 mnemonic generation.
 * Maps to word counts: 128 -> 12, 160 -> 15, 192 -> 18, 224 -> 21, 256 -> 24.
 */
export type MnemonicStrength = 128 | 160 | 192 | 224 | 256;

/**
 * Word count for each entropy strength.
 */
export const WORD_COUNTS: Record<MnemonicStrength, number> = {
	128: 12,
	160: 15,
	192: 18,
	224: 21,
	256: 24,
} as const;
