/**
 * SourceMap Benchmarks - mitata format
 * Solidity source map parsing and manipulation
 */

import { bench, run } from "mitata";
import * as SourceMap from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Small source map (3 entries)
const smallSourceMap = "0:50:0:-;51:100:0:-;151:25:0:o";

// Medium source map (20 entries, typical function)
const mediumSourceMap = [
	"0:50:0:-",
	"51:100:0:-",
	"151:25:0:i",
	"176:30:0:-",
	"206:45:0:-",
	"251:80:0:o",
	"331:15:0:-",
	"346:60:0:-",
	"406:35:0:i",
	"441:20:0:-",
	"461:90:0:-",
	"551:40:0:o",
	"591:25:0:-",
	"616:55:0:-",
	"671:30:0:i",
	"701:45:0:-",
	"746:60:0:-",
	"806:20:0:o",
	"826:35:0:-",
	"861:50:0:-",
].join(";");

// Large source map (100 entries, complex contract)
const largeSourceMapEntries: string[] = [];
let offset = 0;
for (let i = 0; i < 100; i++) {
	const length = 20 + Math.floor(Math.random() * 80);
	const fileIndex = i % 3;
	const jump = ["-", "i", "o"][i % 3];
	largeSourceMapEntries.push(`${offset}:${length}:${fileIndex}:${jump}`);
	offset += length + 1;
}
const largeSourceMap = largeSourceMapEntries.join(";");

// Compressed source map (with inherited fields)
const compressedSourceMap = "0:50:0:-;::1:i;;100:25::o;::2:";

// Source map with modifier depth
const modifierDepthMap = "0:50:0:-:1;51:100:0:-:2;151:25:0:o:0";

// Pre-parsed instances
const smallParsed = SourceMap.from(smallSourceMap);
const mediumParsed = SourceMap.from(mediumSourceMap);
const largeParsed = SourceMap.from(largeSourceMap);

// ============================================================================
// SourceMap.from - construction
// ============================================================================

bench("SourceMap.from - small (3 entries) - voltaire", () => {
	SourceMap.from(smallSourceMap);
});

bench("SourceMap.from - medium (20 entries) - voltaire", () => {
	SourceMap.from(mediumSourceMap);
});

bench("SourceMap.from - large (100 entries) - voltaire", () => {
	SourceMap.from(largeSourceMap);
});

await run();

// ============================================================================
// SourceMap.parse - full parsing
// ============================================================================

bench("SourceMap.parse - small (3 entries) - voltaire", () => {
	SourceMap.parse(smallSourceMap);
});

bench("SourceMap.parse - medium (20 entries) - voltaire", () => {
	SourceMap.parse(mediumSourceMap);
});

bench("SourceMap.parse - large (100 entries) - voltaire", () => {
	SourceMap.parse(largeSourceMap);
});

await run();

// ============================================================================
// SourceMap.parse - compressed format
// ============================================================================

bench("SourceMap.parse - compressed - voltaire", () => {
	SourceMap.parse(compressedSourceMap);
});

bench("SourceMap.parse - modifier depth - voltaire", () => {
	SourceMap.parse(modifierDepthMap);
});

await run();

// ============================================================================
// SourceMap.toEntries
// ============================================================================

bench("SourceMap.toEntries - small - voltaire", () => {
	SourceMap.toEntries(smallSourceMap);
});

bench("SourceMap.toEntries - medium - voltaire", () => {
	SourceMap.toEntries(mediumSourceMap);
});

bench("SourceMap.toEntries - large - voltaire", () => {
	SourceMap.toEntries(largeSourceMap);
});

await run();

// ============================================================================
// SourceMap.toString - serialization
// ============================================================================

bench("SourceMap.toString - small - voltaire", () => {
	SourceMap.toString(smallParsed);
});

bench("SourceMap.toString - medium - voltaire", () => {
	SourceMap.toString(mediumParsed);
});

bench("SourceMap.toString - large - voltaire", () => {
	SourceMap.toString(largeParsed);
});

await run();

// ============================================================================
// SourceMap.getEntryAt - random access
// ============================================================================

bench("SourceMap.getEntryAt - first - voltaire", () => {
	SourceMap.getEntryAt(smallParsed, 0);
});

bench("SourceMap.getEntryAt - middle - voltaire", () => {
	SourceMap.getEntryAt(mediumParsed, 10);
});

bench("SourceMap.getEntryAt - large middle - voltaire", () => {
	SourceMap.getEntryAt(largeParsed, 50);
});

bench("SourceMap.getEntryAt - last - voltaire", () => {
	SourceMap.getEntryAt(largeParsed, 99);
});

await run();

// ============================================================================
// Round-trip: parse + toString
// ============================================================================

bench("roundtrip (parse+toString) - small - voltaire", () => {
	const parsed = SourceMap.parse(smallSourceMap);
	SourceMap.toString(parsed);
});

bench("roundtrip (parse+toString) - medium - voltaire", () => {
	const parsed = SourceMap.parse(mediumSourceMap);
	SourceMap.toString(parsed);
});

bench("roundtrip (parse+toString) - large - voltaire", () => {
	const parsed = SourceMap.parse(largeSourceMap);
	SourceMap.toString(parsed);
});

await run();

// ============================================================================
// Sequential access pattern (typical debugger use)
// ============================================================================

bench("sequential access - 10 entries - voltaire", () => {
	const map = SourceMap.from(mediumSourceMap);
	for (let i = 0; i < 10; i++) {
		SourceMap.getEntryAt(map, i);
	}
});

bench("sequential access - 50 entries - voltaire", () => {
	const map = SourceMap.from(largeSourceMap);
	for (let i = 0; i < 50; i++) {
		SourceMap.getEntryAt(map, i);
	}
});

await run();
