import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Comprehensive SIWE message validation

console.log("\n=== Valid Message ===\n");

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const validMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const validResult = Siwe.validate(validMessage);
console.log("Valid message:", validResult.valid);

console.log("\n=== Domain Validation ===\n");

// Empty domain
const emptyDomain = {
	...validMessage,
	domain: "",
};
const emptyDomainResult = Siwe.validate(emptyDomain);
console.log("Empty domain:", emptyDomainResult.valid);
if (!emptyDomainResult.valid) {
	console.log("- Error type:", emptyDomainResult.error.type);
	console.log("- Error message:", emptyDomainResult.error.message);
}

console.log("\n=== Address Validation ===\n");

// Invalid address length
const shortAddress = {
	...validMessage,
	address: new Uint8Array(10) as any,
};
const shortAddressResult = Siwe.validate(shortAddress);
console.log("Short address:", shortAddressResult.valid);
if (!shortAddressResult.valid) {
	console.log("- Error type:", shortAddressResult.error.type);
	console.log("- Error message:", shortAddressResult.error.message);
}

// Zero address
const zeroAddress = {
	...validMessage,
	address: new Uint8Array(20) as any,
};
const zeroAddressResult = Siwe.validate(zeroAddress);
console.log("Zero address:", zeroAddressResult.valid);

console.log("\n=== URI Validation ===\n");

// Empty URI
const emptyUri = {
	...validMessage,
	uri: "",
};
const emptyUriResult = Siwe.validate(emptyUri);
console.log("Empty URI:", emptyUriResult.valid);
if (!emptyUriResult.valid) {
	console.log("- Error type:", emptyUriResult.error.type);
	console.log("- Error message:", emptyUriResult.error.message);
}

// Valid complex URIs
const complexUris = [
	"https://example.com/path",
	"https://example.com/path?query=value",
	"https://example.com/path#fragment",
	"http://localhost:3000",
];

complexUris.forEach((uri) => {
	const msg = { ...validMessage, uri };
	const result = Siwe.validate(msg);
	console.log(`URI "${uri}": ${result.valid ? "Valid" : "Invalid"}`);
});

console.log("\n=== Version Validation ===\n");

// Valid version
console.log('Version "1":', Siwe.validate(validMessage).valid);

// Invalid version
const wrongVersion = {
	...validMessage,
	version: "2" as "1",
};
const wrongVersionResult = Siwe.validate(wrongVersion);
console.log('Version "2":', wrongVersionResult.valid);
if (!wrongVersionResult.valid) {
	console.log("- Error type:", wrongVersionResult.error.type);
	console.log("- Error message:", wrongVersionResult.error.message);
}

console.log("\n=== Chain ID Validation ===\n");

// Valid chain IDs
const validChains = [1, 5, 137, 42161, 10, 8453, 31337];
validChains.forEach((chainId) => {
	const msg = { ...validMessage, chainId };
	const result = Siwe.validate(msg);
	console.log(`Chain ${chainId}: ${result.valid ? "Valid" : "Invalid"}`);
});

// Invalid chain IDs
const invalidChains = [0, -1, -100];
invalidChains.forEach((chainId) => {
	const msg = { ...validMessage, chainId };
	const result = Siwe.validate(msg);
	console.log(`Chain ${chainId}: ${result.valid ? "Valid" : "Invalid"}`);
	if (!result.valid) {
		console.log(`  Error: ${result.error.message}`);
	}
});

console.log("\n=== Nonce Validation ===\n");

// Valid nonces
const validNonces = [
	"12345678", // exactly 8
	"abcdefghij", // more than 8
	"Abc123XyZ", // mixed case
	"0123456789abcdef", // hex-like
];

validNonces.forEach((nonce) => {
	const msg = { ...validMessage, nonce };
	const result = Siwe.validate(msg);
	console.log(
		`Nonce "${nonce}" (len ${nonce.length}): ${result.valid ? "Valid" : "Invalid"}`,
	);
});

// Invalid nonce (too short)
const shortNonce = {
	...validMessage,
	nonce: "1234567", // only 7 characters
};
const shortNonceResult = Siwe.validate(shortNonce);
console.log('Nonce "1234567" (len 7):', shortNonceResult.valid);
if (!shortNonceResult.valid) {
	console.log("- Error type:", shortNonceResult.error.type);
	console.log("- Error message:", shortNonceResult.error.message);
}

console.log("\n=== Timestamp Validation ===\n");

// Valid timestamps
const validTimestamps = [
	"2021-09-30T16:25:24Z",
	"2021-09-30T16:25:24.000Z",
	"2021-09-30T16:25:24+00:00",
	"2021-09-30T16:25:24.123456Z",
];

validTimestamps.forEach((issuedAt) => {
	const msg = { ...validMessage, issuedAt };
	const result = Siwe.validate(msg);
	console.log(`Timestamp "${issuedAt}": ${result.valid ? "Valid" : "Invalid"}`);
});

// Invalid timestamp
const invalidTimestamp = {
	...validMessage,
	issuedAt: "not-a-timestamp",
};
const invalidTimestampResult = Siwe.validate(invalidTimestamp);
console.log('Timestamp "not-a-timestamp":', invalidTimestampResult.valid);
if (!invalidTimestampResult.valid) {
	console.log("- Error type:", invalidTimestampResult.error.type);
	console.log("- Error message:", invalidTimestampResult.error.message);
}

console.log("\n=== Expiration Validation ===\n");

const now = new Date("2021-10-01T12:00:00.000Z");

// Not expired
const notExpired = {
	...validMessage,
	expirationTime: "2021-10-01T13:00:00.000Z",
};
const notExpiredResult = Siwe.validate(notExpired, { now });
console.log("Not expired:", notExpiredResult.valid);

// Expired
const expired = {
	...validMessage,
	expirationTime: "2021-10-01T11:00:00.000Z",
};
const expiredResult = Siwe.validate(expired, { now });
console.log("Expired:", expiredResult.valid);
if (!expiredResult.valid) {
	console.log("- Error type:", expiredResult.error.type);
	console.log("- Error message:", expiredResult.error.message);
}

// Exactly at expiration time
const atExpiration = {
	...validMessage,
	expirationTime: "2021-10-01T12:00:00.000Z",
};
const atExpirationResult = Siwe.validate(atExpiration, { now });
console.log("At expiration time:", atExpirationResult.valid);

// Invalid expiration timestamp
const invalidExpiry = {
	...validMessage,
	expirationTime: "invalid-date",
};
const invalidExpiryResult = Siwe.validate(invalidExpiry);
console.log("Invalid expiry timestamp:", invalidExpiryResult.valid);
if (!invalidExpiryResult.valid) {
	console.log("- Error type:", invalidExpiryResult.error.type);
	console.log("- Error message:", invalidExpiryResult.error.message);
}

console.log("\n=== Not Before Validation ===\n");

// Valid (after notBefore)
const afterNotBefore = {
	...validMessage,
	notBefore: "2021-10-01T11:00:00.000Z",
};
const afterNotBeforeResult = Siwe.validate(afterNotBefore, { now });
console.log("After notBefore:", afterNotBeforeResult.valid);

// Invalid (before notBefore)
const beforeNotBefore = {
	...validMessage,
	notBefore: "2021-10-01T13:00:00.000Z",
};
const beforeNotBeforeResult = Siwe.validate(beforeNotBefore, { now });
console.log("Before notBefore:", beforeNotBeforeResult.valid);
if (!beforeNotBeforeResult.valid) {
	console.log("- Error type:", beforeNotBeforeResult.error.type);
	console.log("- Error message:", beforeNotBeforeResult.error.message);
}

// Invalid notBefore timestamp
const invalidNotBefore = {
	...validMessage,
	notBefore: "invalid-date",
};
const invalidNotBeforeResult = Siwe.validate(invalidNotBefore);
console.log("Invalid notBefore timestamp:", invalidNotBeforeResult.valid);
if (!invalidNotBeforeResult.valid) {
	console.log("- Error type:", invalidNotBeforeResult.error.type);
	console.log("- Error message:", invalidNotBeforeResult.error.message);
}

console.log("\n=== Time Window Validation ===\n");

// Valid time window
const validWindow = {
	...validMessage,
	notBefore: "2021-10-01T11:00:00.000Z",
	expirationTime: "2021-10-01T13:00:00.000Z",
};
const validWindowResult = Siwe.validate(validWindow, { now });
console.log("Within time window:", validWindowResult.valid);

// Before window
const beforeWindow = Siwe.validate(validWindow, {
	now: new Date("2021-10-01T10:00:00.000Z"),
});
console.log("Before window:", beforeWindow.valid);
if (!beforeWindow.valid) {
	console.log("- Error:", beforeWindow.error.type);
}

// After window
const afterWindow = Siwe.validate(validWindow, {
	now: new Date("2021-10-01T14:00:00.000Z"),
});
console.log("After window:", afterWindow.valid);
if (!afterWindow.valid) {
	console.log("- Error:", afterWindow.error.type);
}

console.log("\n=== Complete Validation ===\n");

// All fields valid
const complete = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement: "Sign in to Example",
	expirationTime: new Date(Date.now() + 3600000).toISOString(),
	notBefore: new Date().toISOString(),
	requestId: "req-123",
	resources: ["https://example.com/resource"],
});

const completeResult = Siwe.validate(complete);
console.log("Complete message:", completeResult.valid);

console.log("\n=== Validation Error Types ===\n");

const errorTypes = [
	{ msg: { ...validMessage, domain: "" }, expectedError: "invalid_domain" },
	{
		msg: { ...validMessage, address: new Uint8Array(10) as any },
		expectedError: "invalid_address",
	},
	{ msg: { ...validMessage, uri: "" }, expectedError: "invalid_uri" },
	{
		msg: { ...validMessage, version: "0" as "1" },
		expectedError: "invalid_version",
	},
	{ msg: { ...validMessage, chainId: 0 }, expectedError: "invalid_chain_id" },
	{ msg: { ...validMessage, nonce: "short" }, expectedError: "invalid_nonce" },
	{
		msg: { ...validMessage, issuedAt: "bad" },
		expectedError: "invalid_timestamp",
	},
	{
		msg: {
			...validMessage,
			expirationTime: "2020-01-01T00:00:00Z",
		},
		expectedError: "expired",
	},
	{
		msg: {
			...validMessage,
			notBefore: "2099-01-01T00:00:00Z",
		},
		expectedError: "not_yet_valid",
	},
];

errorTypes.forEach(({ msg, expectedError }) => {
	const result = Siwe.validate(msg);
	if (!result.valid) {
		console.log(
			`${expectedError}: ${result.error.type === expectedError ? "✓" : "✗"}`,
		);
	}
});
