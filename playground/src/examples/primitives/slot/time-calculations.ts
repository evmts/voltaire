import * as Slot from "../../../primitives/Slot/index.js";

// Example: Time calculations with slots
// Slots are 12 seconds apart starting from the merge (genesis time)

const SECONDS_PER_SLOT = 12;
const GENESIS_TIME = 1606824023; // Dec 1, 2020 12:00:23 UTC (Beacon chain genesis)

// Calculate timestamp from slot
function slotToTimestamp(slot: bigint): number {
	return GENESIS_TIME + Number(slot) * SECONDS_PER_SLOT;
}

// Calculate slot from timestamp
function timestampToSlot(timestamp: number): bigint {
	const secondsSinceGenesis = timestamp - GENESIS_TIME;
	if (secondsSinceGenesis < 0) return 0n;
	return BigInt(Math.floor(secondsSinceGenesis / SECONDS_PER_SLOT));
}
const slots = [
	Slot.from(0),
	Slot.from(1000),
	Slot.from(100000),
	Slot.from(1000000),
	Slot.from(7000000),
];

for (const slot of slots) {
	const timestamp = slotToTimestamp(slot);
	const date = new Date(timestamp * 1000);
}
const now = Math.floor(Date.now() / 1000);
const currentSlot = Slot.from(timestampToSlot(now));
const currentEpoch = Slot.toEpoch(currentSlot);
const durations = [
	{ slots: 1, label: "1 slot" },
	{ slots: 32, label: "1 epoch" },
	{ slots: 32 * 10, label: "10 epochs" },
	{ slots: 32 * 100, label: "100 epochs" },
	{ slots: 7200, label: "1 day" },
];

for (const { slots, label } of durations) {
	const seconds = slots * SECONDS_PER_SLOT;
	const minutes = seconds / 60;
	const hours = minutes / 60;
	const days = hours / 24;

	let timeStr = "";
	if (days >= 1) {
		timeStr = `${days.toFixed(2)} days`;
	} else if (hours >= 1) {
		timeStr = `${hours.toFixed(2)} hours`;
	} else if (minutes >= 1) {
		timeStr = `${minutes.toFixed(2)} minutes`;
	} else {
		timeStr = `${seconds} seconds`;
	}
}
const currentTimestamp = slotToTimestamp(currentSlot);
const nextSlot = Slot.from(currentSlot + 1n);
const nextTimestamp = slotToTimestamp(nextSlot);
const secondsUntilNext = nextTimestamp - now;
const historicalDates = [
	{ date: "2020-12-01T12:00:23Z", label: "Genesis" },
	{ date: "2022-09-15T06:42:42Z", label: "The Merge (approx)" },
	{ date: "2023-04-12T22:27:35Z", label: "Shapella (approx)" },
	{ date: "2024-03-13T13:55:35Z", label: "Dencun (approx)" },
];

for (const { date, label } of historicalDates) {
	const timestamp = Math.floor(new Date(date).getTime() / 1000);
	const slot = Slot.from(timestampToSlot(timestamp));
	const epoch = Slot.toEpoch(slot);
}
const periods = [
	{ seconds: 60, label: "Minute" },
	{ seconds: 3600, label: "Hour" },
	{ seconds: 86400, label: "Day" },
	{ seconds: 604800, label: "Week" },
	{ seconds: 2592000, label: "Month (30d)" },
	{ seconds: 31536000, label: "Year" },
];

for (const { seconds, label } of periods) {
	const slots = Math.floor(seconds / SECONDS_PER_SLOT);
	const epochs = Math.floor(slots / 32);
}
