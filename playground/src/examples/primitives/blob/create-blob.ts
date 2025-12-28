import { Blob } from "voltaire";
const empty = Blob.from(new Uint8Array(Blob.SIZE));
const text = "This data will be automatically encoded into field elements";
const encoded = new TextEncoder().encode(text);
const blob1 = Blob.fromData(encoded);
// Create properly formatted blob (4096 field elements, 32 bytes each)
const raw = new Uint8Array(Blob.SIZE);
// First field element: 0x00 (high byte) + 31 bytes of data
raw[0] = 0x00; // High byte must be 0x00
raw.set(new TextEncoder().encode("Direct field element data"), 1);
const blob2 = Blob.from(raw);
const randomData = new Uint8Array(100000);
crypto.getRandomValues(randomData);
const blob3 = Blob.fromData(randomData);
const maxDataSize =
	Blob.FIELD_ELEMENTS_PER_BLOB * (Blob.BYTES_PER_FIELD_ELEMENT - 1);

// Test maximum size
const maxData = new Uint8Array(maxDataSize);
maxData.fill(0xff);
const maxBlob = Blob.fromData(maxData);
