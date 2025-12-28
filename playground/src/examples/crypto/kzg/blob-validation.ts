import { Bytes, KZG } from "@tevm/voltaire";
// Example: Blob validation and constraints

// EIP-4844 constants
const BYTES_PER_BLOB = 131072;
const BYTES_PER_FIELD_ELEMENT = 32;
const FIELD_ELEMENTS_PER_BLOB = 4096;

KZG.loadTrustedSetup();
const emptyBlob = KZG.createEmptyBlob();
try {
	KZG.validateBlob(emptyBlob);
} catch (_error: unknown) {
	// Handle validation error
}
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
	// Use validElements to avoid unused variable warning
	if (!validElements) {
		console.info("Invalid field elements detected");
	}
} catch (_error: unknown) {
	// Handle validation error
}
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
} catch (_error: unknown) {
	// Handle validation error
}
const tooSmall = Bytes.zero(1000);
try {
	KZG.validateBlob(tooSmall);
} catch (_error: unknown) {
	// Expected: blob too small
}
const tooLarge = Bytes.zero(200000);
try {
	KZG.validateBlob(tooLarge);
} catch (_error: unknown) {
	// Expected: blob too large
}
try {
	// @ts-expect-error Testing null input handling
	KZG.validateBlob(null);
} catch (_error: unknown) {
	// Expected: null input
}
try {
	// @ts-expect-error Testing string input handling
	KZG.validateBlob("blob");
} catch (_error: unknown) {
	// Expected: wrong type
}
const generatedBlob = KZG.generateRandomBlob();
let allHighBytesZero = true;
for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
	if (generatedBlob[i * BYTES_PER_FIELD_ELEMENT] !== 0) {
		allHighBytesZero = false;
		break;
	}
}
// Use allHighBytesZero to avoid unused variable warning
if (!allHighBytesZero) {
	console.info("Generated blob has non-zero high bytes");
}

KZG.freeTrustedSetup();
