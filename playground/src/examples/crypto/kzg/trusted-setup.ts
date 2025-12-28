import { KZG } from "@tevm/voltaire";
KZG.loadTrustedSetup();
try {
	const blob = KZG.generateRandomBlob();
	KZG.Commitment(blob);
} catch (_error: unknown) {
	// Handle commitment error
}
KZG.loadTrustedSetup();
KZG.loadTrustedSetup();
KZG.freeTrustedSetup();
try {
	const blob = KZG.createEmptyBlob();
	KZG.Commitment(blob);
} catch (_error: unknown) {
	// Expected: setup not loaded
}
KZG.loadTrustedSetup();

KZG.freeTrustedSetup();
