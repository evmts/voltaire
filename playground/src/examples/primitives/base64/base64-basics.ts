import * as Base64 from "../../../primitives/Base64/index.js";
const data = new Uint8Array([72, 101, 108, 108, 111]);
const encoded = Base64.encode(data);
const text = "Hello, world!";
const encodedText = Base64.encodeString(text);
const decodedBytes = Base64.decode(encoded);
const decodedText = Base64.decodeToString(encodedText);
const binaryData = new Uint8Array([255, 254, 253, 252, 251]);
const standardEncoding = Base64.encode(binaryData);
const urlSafeEncoding = Base64.encodeUrlSafe(binaryData);
const brandedB64 = Base64.from("SGVsbG8=");
const bytesFromBranded = Base64.toBytes(brandedB64);

const brandedUrlSafe = Base64.fromUrlSafe("SGVsbG8");
const bytesFromUrlSafe = Base64.toBytesUrlSafe(brandedUrlSafe);
const inputSize = 100;
const encodedSize = Base64.calcEncodedSize(inputSize);
const decodedSize = Base64.calcDecodedSize(encodedSize);
