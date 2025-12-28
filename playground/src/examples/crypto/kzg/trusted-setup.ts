import { KZG } from "@tevm/voltaire";
KZG.loadTrustedSetup();
try {
	const blob = KZG.generateRandomBlob();
	const commitment = KZG.Commitment(blob);
} catch (error) {}
KZG.loadTrustedSetup();
KZG.loadTrustedSetup();
KZG.freeTrustedSetup();
try {
	const blob = KZG.createEmptyBlob();
	KZG.Commitment(blob);
} catch (error: any) {}
KZG.loadTrustedSetup();

KZG.freeTrustedSetup();
