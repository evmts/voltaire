import { Bytes, KZG } from "@tevm/voltaire";
// Example: Converting blobs to KZG commitments

// Initialize
KZG.loadTrustedSetup();
const emptyBlob = KZG.createEmptyBlob();
const commitment1 = KZG.Commitment(emptyBlob);
const randomBlob = KZG.generateRandomBlob();
const commitment2 = KZG.Commitment(randomBlob);
const customBlob = Bytes.zero(BYTES_PER_BLOB);
for (let i = 0; i < customBlob.length; i += 32) {
	customBlob[i] = 0; // High byte must be 0 for valid field element
	customBlob[i + 31] = (i / 32) & 0xff; // Pattern in low byte
}
const commitment3 = KZG.Commitment(customBlob);

// Test determinism
const commitment1_again = KZG.Commitment(emptyBlob);

KZG.freeTrustedSetup();
