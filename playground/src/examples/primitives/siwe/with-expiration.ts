import { Address, Siwe } from "@tevm/voltaire";
const address = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Message expires in 1 hour
const oneHourLater = new Date(Date.now() + 3600000).toISOString();
const expiringMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	expirationTime: oneHourLater,
});

// Validate before expiration
const validNow = Siwe.validate(expiringMessage);

// Simulate validation after expiration
const twoHoursLater = new Date(Date.now() + 7200000);
const expiredCheck = Siwe.validate(expiringMessage, { now: twoHoursLater });
if (!expiredCheck.valid) {
}

// Short-lived session (5 minutes)
const shortLived = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	expirationTime: new Date(Date.now() + 300000).toISOString(),
});

// Standard session (1 hour)
const standard = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	expirationTime: new Date(Date.now() + 3600000).toISOString(),
});

// Long-lived session (24 hours)
const longLived = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	expirationTime: new Date(Date.now() + 86400000).toISOString(),
});

// Message is not valid yet (starts in 5 minutes)
const futureStart = new Date(Date.now() + 300000).toISOString();
const notYetValid = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	notBefore: futureStart,
});

// Validate now (should fail)
const tooEarly = Siwe.validate(notYetValid);
if (!tooEarly.valid) {
}

// Validate after notBefore time
const tenMinutesLater = new Date(Date.now() + 600000);
const afterStart = Siwe.validate(notYetValid, { now: tenMinutesLater });

// Valid from now to 1 hour later
const timeWindow = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	notBefore: new Date().toISOString(),
	expirationTime: new Date(Date.now() + 3600000).toISOString(),
});

// Valid from 5 minutes in future to 1 hour later
const futureWindow = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	notBefore: new Date(Date.now() + 300000).toISOString(),
	expirationTime: new Date(Date.now() + 3600000).toISOString(),
});

// Check at different times
const now = new Date();
const inTenMinutes = new Date(Date.now() + 600000);
const inTwoHours = new Date(Date.now() + 7200000);

const checkNow = Siwe.validate(futureWindow, { now: now });
const checkTenMin = Siwe.validate(futureWindow, { now: inTenMinutes });
const checkTwoHours = Siwe.validate(futureWindow, { now: inTwoHours });

// Invalid expiration timestamp
const invalidExpiry = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	expirationTime: "not-a-timestamp",
});

const invalidResult = Siwe.validate(invalidExpiry);
if (!invalidResult.valid) {
}

// Authentication flow: 5 minute window
const authFlow = Siwe.create({
	domain: "auth.example.com",
	address: address,
	uri: "https://auth.example.com/login",
	chainId: 1,
	statement: "Sign in to authenticate",
	expirationTime: new Date(Date.now() + 300000).toISOString(),
});

// Session token: 24 hour lifetime
const sessionToken = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement: "Access application resources",
	expirationTime: new Date(Date.now() + 86400000).toISOString(),
});

// Scheduled action: starts in future
const scheduledAction = Siwe.create({
	domain: "scheduler.example.com",
	address: address,
	uri: "https://scheduler.example.com/action",
	chainId: 1,
	statement: "Authorize scheduled task",
	notBefore: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
	expirationTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
});
