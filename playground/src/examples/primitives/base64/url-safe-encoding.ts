import { Base64 } from "voltaire";
const data = new Uint8Array([255, 254, 253, 252, 251, 250]);
const standard = Base64.encode(data);
const urlSafe = Base64.encodeUrlSafe(data);
const message = "Hello?World&Foo=Bar";
const urlSafeStr = Base64.encodeStringUrlSafe(message);
const decoded = Base64.decodeUrlSafe(urlSafe);
const decodedStr = Base64.decodeUrlSafeToString(urlSafeStr);
const token = { userId: 123, exp: Date.now() + 3600000 };
const tokenJson = JSON.stringify(token);
const tokenEncoded = Base64.encodeStringUrlSafe(tokenJson);
const url = `https://api.example.com/verify?token=${tokenEncoded}`;
const header = { alg: "HS256", typ: "JWT" };
const payload = { sub: "user123", name: "Alice" };
const headerB64 = Base64.encodeStringUrlSafe(JSON.stringify(header));
const payloadB64 = Base64.encodeStringUrlSafe(JSON.stringify(payload));
const jwtStyle = `${headerB64}.${payloadB64}.signature`;
const brandedUrlSafe = Base64.fromUrlSafe(urlSafeStr);

// Try to create branded from standard (should fail)
try {
	Base64.fromUrlSafe("SGVsbG8="); // Has padding
} catch (err) {}
const standardBranded = Base64.from("SGVsbG8=");
const convertedToUrlSafe = Base64.toBase64Url(standardBranded);

const urlSafeBranded = Base64.fromUrlSafe("SGVsbG8");
const convertedToStandard = Base64.toBase64(urlSafeBranded);
