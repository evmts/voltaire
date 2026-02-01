/**
 * Benchmark: RelayData (MEV-Boost Relay) operations
 * Tests relay data parsing and endpoint extraction
 */

import { bench, run } from "mitata";
import * as RelayData from "./index.js";

// Test data - realistic relay configurations
const flashbotsRelay = {
	name: "Flashbots",
	pubkey: "0x" + "ab".repeat(48),
	url: "https://relay.flashbots.net",
};

const bloxrouteRelay = {
	name: "bloXroute Max Profit",
	pubkey: "0x" + "cd".repeat(48),
	url: "https://relay.bloxroute.com",
};

// Pre-created relay data
const relay = RelayData.from(flashbotsRelay);

// ============================================================================
// from (constructor)
// ============================================================================

bench("RelayData.from - Flashbots - voltaire", () => {
	RelayData.from(flashbotsRelay);
});

bench("RelayData.from - bloXroute - voltaire", () => {
	RelayData.from(bloxrouteRelay);
});

await run();

// ============================================================================
// getEndpoint
// ============================================================================

bench("RelayData.getEndpoint - voltaire", () => {
	RelayData.getEndpoint(relay);
});

await run();

// ============================================================================
// Full workflow: from + getEndpoint
// ============================================================================

bench("RelayData workflow - from + getEndpoint - voltaire", () => {
	const r = RelayData.from(flashbotsRelay);
	RelayData.getEndpoint(r);
});

await run();
