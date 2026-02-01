/**
 * Benchmark: PeerInfo operations
 * Tests peer info parsing and capability checking
 */

import { bench, run } from "mitata";
import * as PeerInfo from "./index.js";

// Test data - realistic peer info
const peerInfoData = {
	enode: "enode://abc123...@192.168.1.1:30303",
	id: "abc123...",
	name: "Geth/v1.13.0-stable-abc123/linux-amd64/go1.21",
	caps: ["eth/66", "eth/67", "snap/1"],
	network: {
		localAddress: "192.168.1.100:30303",
		remoteAddress: "192.168.1.1:30303",
		inbound: false,
		trusted: false,
		static: false,
	},
	protocols: {
		eth: {
			difficulty: 1000000n,
			head: "0x" + "ab".repeat(32),
			version: 67,
		},
	},
};

const inboundPeerData = {
	...peerInfoData,
	network: {
		...peerInfoData.network,
		inbound: true,
	},
};

// Pre-created peer info
const peerInfo = PeerInfo.from(peerInfoData);
const inboundPeer = PeerInfo.from(inboundPeerData);

// ============================================================================
// from (constructor)
// ============================================================================

bench("PeerInfo.from - voltaire", () => {
	PeerInfo.from(peerInfoData);
});

await run();

// ============================================================================
// hasCapability
// ============================================================================

bench("PeerInfo.hasCapability - eth/67 (has) - voltaire", () => {
	PeerInfo.hasCapability(peerInfo, "eth/67");
});

bench("PeerInfo.hasCapability - eth/68 (missing) - voltaire", () => {
	PeerInfo.hasCapability(peerInfo, "eth/68");
});

bench("PeerInfo.hasCapability - snap/1 (has) - voltaire", () => {
	PeerInfo.hasCapability(peerInfo, "snap/1");
});

await run();

// ============================================================================
// isInbound
// ============================================================================

bench("PeerInfo.isInbound - outbound - voltaire", () => {
	PeerInfo.isInbound(peerInfo);
});

bench("PeerInfo.isInbound - inbound - voltaire", () => {
	PeerInfo.isInbound(inboundPeer);
});

await run();

// ============================================================================
// Full workflow: from + hasCapability + isInbound
// ============================================================================

bench("PeerInfo workflow - from + checks - voltaire", () => {
	const peer = PeerInfo.from(peerInfoData);
	PeerInfo.hasCapability(peer, "eth/67");
	PeerInfo.isInbound(peer);
});

await run();
