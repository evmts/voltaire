import { Base64, Bytes } from "@tevm/voltaire";
const data = Bytes([72, 101, 108, 108, 111]);
const encoded = Base64.encode(data);
const text = "Hello, world!";
const encodedText = Base64.encodeString(text);
const decodedBytes = Base64.decode(encoded);
const decodedText = Base64.decodeToString(encodedText);
const binaryData = Bytes([255, 254, 253, 252, 251]);
const standardEncoding = Base64.encode(binaryData);
const urlSafeEncoding = Base64.encodeUrlSafe(binaryData);
const brandedB64 = Base64("SGVsbG8=");
const bytesFromBranded = Base64.toBytes(brandedB64);

const brandedUrlSafe = Base64.fromUrlSafe("SGVsbG8");
const bytesFromUrlSafe = Base64.toBytesUrlSafe(brandedUrlSafe);
const inputSize = 100;
const encodedSize = Base64.calcEncodedSize(inputSize);
const decodedSize = Base64.calcDecodedSize(encodedSize);
