/**
 * Benchmark: PeerId (enode) operations
 * Tests enode parsing and comparison
 */

import { bench, run } from "mitata";
import * as PeerId from "./index.js";

// Test data - realistic enode URLs
const enode1 = "enode://abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123de@192.168.1.1:30303";
const enode2 = "enode://def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456ab@192.168.1.2:30303";
const enodeSame = "enode://abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456abc123de@192.168.1.1:30303";

// Pre-created peer IDs
const peerId1 = PeerId.from(enode1);
const peerId2 = PeerId.from(enode2);

// ============================================================================
// from (constructor)
// ============================================================================

bench("PeerId.from - voltaire", () => {
	PeerId.from(enode1);
});

await run();

// ============================================================================
// parse
// ============================================================================

bench("PeerId.parse - voltaire", () => {
	PeerId.parse(enode1);
});

await run();

// ============================================================================
// toString
// ============================================================================

bench("PeerId.toString - voltaire", () => {
	PeerId.toString(enode1);
});

await run();

// ============================================================================
// equals
// ============================================================================

bench("PeerId.equals - same - voltaire", () => {
	PeerId.equals(enode1, enodeSame);
});

bench("PeerId.equals - different - voltaire", () => {
	PeerId.equals(enode1, enode2);
});

await run();

// ============================================================================
// Full workflow: from + parse
// ============================================================================

bench("PeerId workflow - from + parse - voltaire", () => {
	const peer = PeerId.from(enode1);
	PeerId.parse(enode1);
});

await run();
