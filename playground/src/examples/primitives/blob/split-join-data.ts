import { Blob, Bytes } from "@tevm/voltaire";
const maxPerBlob =
	Blob.FIELD_ELEMENTS_PER_BLOB * (Blob.BYTES_PER_FIELD_ELEMENT - 1);
const smallText = "This fits in one blob easily.";
const smallData = new TextEncoder().encode(smallText);

const smallBlobs = Blob.splitData(smallData);

const joinedSmall = Blob.joinData(smallBlobs);
const decodedSmall = new TextDecoder().decode(joinedSmall);
// Create data that requires multiple blobs
const largeSize = maxPerBlob * 2.5; // 2.5 blobs worth
const largeData = Bytes.zero(Math.floor(largeSize));
crypto.getRandomValues(largeData);

const largeBlobs = Blob.splitData(largeData);
const joinedLarge = Blob.joinData(largeBlobs);
const maxTxData = maxPerBlob * Blob.MAX_PER_TRANSACTION;
for (let i = 1; i <= Blob.MAX_PER_TRANSACTION; i++) {
	const gas = Blob.calculateGas(i);
	const dataCapacity = maxPerBlob * i;
}
const longText = "A".repeat(150000); // 150KB of text
const longData = new TextEncoder().encode(longText);

const textBlobs = Blob.splitData(longData);

const joinedText = Blob.joinData(textBlobs);
const decodedText = new TextDecoder().decode(joinedText);
