/**
 * Benchmark: License (SPDX) operations
 * Tests license validation and OSI approval checking
 */

import { bench, run } from "mitata";
import * as License from "./index.js";

// Test data
const mitLicense = "MIT";
const apache2License = "Apache-2.0";
const gpl3License = "GPL-3.0";
const unknownLicense = "UNKNOWN-LICENSE";
const proprietary = "UNLICENSED";

// ============================================================================
// from (constructor)
// ============================================================================

bench("License.from - MIT - voltaire", () => {
	License.from(mitLicense);
});

bench("License.from - Apache-2.0 - voltaire", () => {
	License.from(apache2License);
});

bench("License.from - unknown - voltaire", () => {
	License.from(unknownLicense);
});

await run();

// ============================================================================
// isOSI (check if OSI approved)
// ============================================================================

bench("License.isOSI - MIT (approved) - voltaire", () => {
	License.isOSI(mitLicense);
});

bench("License.isOSI - GPL-3.0 (approved) - voltaire", () => {
	License.isOSI(gpl3License);
});

bench("License.isOSI - UNLICENSED (not approved) - voltaire", () => {
	License.isOSI(proprietary);
});

bench("License.isOSI - unknown - voltaire", () => {
	License.isOSI(unknownLicense);
});

await run();

// ============================================================================
// toString
// ============================================================================

bench("License.toString - MIT - voltaire", () => {
	License.toString(mitLicense);
});

bench("License.toString - Apache-2.0 - voltaire", () => {
	License.toString(apache2License);
});

await run();
