import * as Address from "../../../primitives/Address/index.js";
import * as Siwe from "../../../primitives/Siwe/index.js";

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const validMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const validResult = Siwe.validate(validMessage);

// Empty domain
const emptyDomain = {
	...validMessage,
	domain: "",
};
const emptyDomainResult = Siwe.validate(emptyDomain);
if (!emptyDomainResult.valid) {
}

// Invalid address length
const shortAddress = {
	...validMessage,
	address: new Uint8Array(10) as any,
};
const shortAddressResult = Siwe.validate(shortAddress);
if (!shortAddressResult.valid) {
}

// Zero address
const zeroAddress = {
	...validMessage,
	address: new Uint8Array(20) as any,
};
const zeroAddressResult = Siwe.validate(zeroAddress);

// Empty URI
const emptyUri = {
	...validMessage,
	uri: "",
};
const emptyUriResult = Siwe.validate(emptyUri);
if (!emptyUriResult.valid) {
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
});

// Invalid version
const wrongVersion = {
	...validMessage,
	version: "2" as "1",
};
const wrongVersionResult = Siwe.validate(wrongVersion);
if (!wrongVersionResult.valid) {
}

// Valid chain IDs
const validChains = [1, 5, 137, 42161, 10, 8453, 31337];
validChains.forEach((chainId) => {
	const msg = { ...validMessage, chainId };
	const result = Siwe.validate(msg);
});

// Invalid chain IDs
const invalidChains = [0, -1, -100];
invalidChains.forEach((chainId) => {
	const msg = { ...validMessage, chainId };
	const result = Siwe.validate(msg);
	if (!result.valid) {
	}
});

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
});

// Invalid nonce (too short)
const shortNonce = {
	...validMessage,
	nonce: "1234567", // only 7 characters
};
const shortNonceResult = Siwe.validate(shortNonce);
if (!shortNonceResult.valid) {
}

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
});

// Invalid timestamp
const invalidTimestamp = {
	...validMessage,
	issuedAt: "not-a-timestamp",
};
const invalidTimestampResult = Siwe.validate(invalidTimestamp);
if (!invalidTimestampResult.valid) {
}

const now = new Date("2021-10-01T12:00:00.000Z");

// Not expired
const notExpired = {
	...validMessage,
	expirationTime: "2021-10-01T13:00:00.000Z",
};
const notExpiredResult = Siwe.validate(notExpired, { now });

// Expired
const expired = {
	...validMessage,
	expirationTime: "2021-10-01T11:00:00.000Z",
};
const expiredResult = Siwe.validate(expired, { now });
if (!expiredResult.valid) {
}

// Exactly at expiration time
const atExpiration = {
	...validMessage,
	expirationTime: "2021-10-01T12:00:00.000Z",
};
const atExpirationResult = Siwe.validate(atExpiration, { now });

// Invalid expiration timestamp
const invalidExpiry = {
	...validMessage,
	expirationTime: "invalid-date",
};
const invalidExpiryResult = Siwe.validate(invalidExpiry);
if (!invalidExpiryResult.valid) {
}

// Valid (after notBefore)
const afterNotBefore = {
	...validMessage,
	notBefore: "2021-10-01T11:00:00.000Z",
};
const afterNotBeforeResult = Siwe.validate(afterNotBefore, { now });

// Invalid (before notBefore)
const beforeNotBefore = {
	...validMessage,
	notBefore: "2021-10-01T13:00:00.000Z",
};
const beforeNotBeforeResult = Siwe.validate(beforeNotBefore, { now });
if (!beforeNotBeforeResult.valid) {
}

// Invalid notBefore timestamp
const invalidNotBefore = {
	...validMessage,
	notBefore: "invalid-date",
};
const invalidNotBeforeResult = Siwe.validate(invalidNotBefore);
if (!invalidNotBeforeResult.valid) {
}

// Valid time window
const validWindow = {
	...validMessage,
	notBefore: "2021-10-01T11:00:00.000Z",
	expirationTime: "2021-10-01T13:00:00.000Z",
};
const validWindowResult = Siwe.validate(validWindow, { now });

// Before window
const beforeWindow = Siwe.validate(validWindow, {
	now: new Date("2021-10-01T10:00:00.000Z"),
});
if (!beforeWindow.valid) {
}

// After window
const afterWindow = Siwe.validate(validWindow, {
	now: new Date("2021-10-01T14:00:00.000Z"),
});
if (!afterWindow.valid) {
}

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
	}
});
