import { Bytes, KZG } from "@tevm/voltaire";
// Example: Blob validation and constraints

KZG.loadTrustedSetup();
const emptyBlob = KZG.createEmptyBlob();
try {
	KZG.validateBlob(emptyBlob);
} catch (error: any) {}
const randomBlob = KZG.generateRandomBlob();
try {
	KZG.validateBlob(randomBlob);
	// Check field element constraints
	let validElements = true;
	for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
		const highByte = randomBlob[i * BYTES_PER_FIELD_ELEMENT];
		if (highByte !== 0) {
			validElements = false;
			break;
		}
	}
} catch (error: any) {}
const customBlob = Bytes.zero(BYTES_PER_BLOB);
for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
	customBlob[i * BYTES_PER_FIELD_ELEMENT] = 0; // High byte must be 0
	// Fill rest with pattern
	for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
		customBlob[i * BYTES_PER_FIELD_ELEMENT + j] = (i + j) & 0xff;
	}
}
try {
	KZG.validateBlob(customBlob);
} catch (error: any) {}
const tooSmall = Bytes.zero(1000);
try {
	KZG.validateBlob(tooSmall);
} catch (error: any) {}
const tooLarge = Bytes.zero(200000);
try {
	KZG.validateBlob(tooLarge);
} catch (error: any) {}
try {
	KZG.validateBlob(null as any);
} catch (error: any) {}
try {
	KZG.validateBlob("blob" as any);
} catch (error: any) {}
const generatedBlob = KZG.generateRandomBlob();
let allHighBytesZero = true;
for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
	if (generatedBlob[i * BYTES_PER_FIELD_ELEMENT] !== 0) {
		allHighBytesZero = false;
		break;
	}
}

KZG.freeTrustedSetup();
