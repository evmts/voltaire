import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Time-based validation with expiration and notBefore

console.log("\n=== Expiration Time ===\n");

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Message expires in 1 hour
const oneHourLater = new Date(Date.now() + 3600000).toISOString();
const expiringMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	expirationTime: oneHourLater,
});

console.log("Message expires at:", expiringMessage.expirationTime);
console.log("Current time:", new Date().toISOString());

// Validate before expiration
const validNow = Siwe.validate(expiringMessage);
console.log("Valid now:", validNow.valid);

// Simulate validation after expiration
const twoHoursLater = new Date(Date.now() + 7200000);
const expiredCheck = Siwe.validate(expiringMessage, { now: twoHoursLater });
console.log("Valid 2 hours later:", expiredCheck.valid);
if (!expiredCheck.valid) {
	console.log("Error type:", expiredCheck.error.type);
	console.log("Error message:", expiredCheck.error.message);
}

console.log("\n=== Different Expiration Periods ===\n");

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

console.log("Short-lived (5 min):", shortLived.expirationTime);
console.log("Standard (1 hour):", standard.expirationTime);
console.log("Long-lived (24 hours):", longLived.expirationTime);

console.log("\n=== Not Before Time ===\n");

// Message is not valid yet (starts in 5 minutes)
const futureStart = new Date(Date.now() + 300000).toISOString();
const notYetValid = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	notBefore: futureStart,
});

console.log("Not before:", notYetValid.notBefore);
console.log("Current time:", new Date().toISOString());

// Validate now (should fail)
const tooEarly = Siwe.validate(notYetValid);
console.log("Valid now:", tooEarly.valid);
if (!tooEarly.valid) {
	console.log("Error type:", tooEarly.error.type);
	console.log("Error message:", tooEarly.error.message);
}

// Validate after notBefore time
const tenMinutesLater = new Date(Date.now() + 600000);
const afterStart = Siwe.validate(notYetValid, { now: tenMinutesLater });
console.log("Valid after start time:", afterStart.valid);

console.log("\n=== Combined Time Windows ===\n");

// Valid from now to 1 hour later
const timeWindow = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	notBefore: new Date().toISOString(),
	expirationTime: new Date(Date.now() + 3600000).toISOString(),
});

console.log("Not before:", timeWindow.notBefore);
console.log("Expires at:", timeWindow.expirationTime);

// Valid from 5 minutes in future to 1 hour later
const futureWindow = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	notBefore: new Date(Date.now() + 300000).toISOString(),
	expirationTime: new Date(Date.now() + 3600000).toISOString(),
});

console.log("\nFuture window:");
console.log("Not before:", futureWindow.notBefore);
console.log("Expires at:", futureWindow.expirationTime);

// Check at different times
const now = new Date();
const inTenMinutes = new Date(Date.now() + 600000);
const inTwoHours = new Date(Date.now() + 7200000);

const checkNow = Siwe.validate(futureWindow, { now: now });
const checkTenMin = Siwe.validate(futureWindow, { now: inTenMinutes });
const checkTwoHours = Siwe.validate(futureWindow, { now: inTwoHours });

console.log("\nValidation results:");
console.log("Now:", checkNow.valid);
console.log("In 10 minutes:", checkTenMin.valid);
console.log("In 2 hours:", checkTwoHours.valid);

console.log("\n=== Timestamp Validation ===\n");

// Invalid expiration timestamp
const invalidExpiry = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	expirationTime: "not-a-timestamp",
});

const invalidResult = Siwe.validate(invalidExpiry);
console.log("Invalid timestamp:", invalidResult.valid);
if (!invalidResult.valid) {
	console.log("Error type:", invalidResult.error.type);
	console.log("Error message:", invalidResult.error.message);
}

console.log("\n=== Real-World Patterns ===\n");

// Authentication flow: 5 minute window
const authFlow = Siwe.create({
	domain: "auth.example.com",
	address: address,
	uri: "https://auth.example.com/login",
	chainId: 1,
	statement: "Sign in to authenticate",
	expirationTime: new Date(Date.now() + 300000).toISOString(),
});

console.log("Auth flow (5 min):");
console.log("- Issued:", authFlow.issuedAt);
console.log("- Expires:", authFlow.expirationTime);

// Session token: 24 hour lifetime
const sessionToken = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement: "Access application resources",
	expirationTime: new Date(Date.now() + 86400000).toISOString(),
});

console.log("\nSession token (24 hours):");
console.log("- Issued:", sessionToken.issuedAt);
console.log("- Expires:", sessionToken.expirationTime);

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

console.log("\nScheduled action (1-2 hours):");
console.log("- Not before:", scheduledAction.notBefore);
console.log("- Expires:", scheduledAction.expirationTime);
