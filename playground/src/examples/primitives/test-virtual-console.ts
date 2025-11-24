/**
 * Test Virtual Console with 10k+ entries
 * This demonstrates the virtual scrolling performance optimization
 */

// Generate massive output to test virtual scrolling
console.log("Starting virtual console stress test...");

// Log 10,000 entries
for (let i = 0; i < 10000; i++) {
	if (i % 1000 === 0) {
		console.log(`Progress: ${i}/10000`);
	}

	if (i % 100 === 0) {
		console.error(
			`Error ${i}: Simulated error message with longer text to test rendering`,
		);
	} else if (i % 50 === 0) {
		console.warn(`Warning ${i}: Simulated warning`);
	} else if (i % 25 === 0) {
		console.info(`Info ${i}: Simulated info message`);
	} else {
		console.log(`Log ${i}: Regular log entry`);
	}
}

console.log("Virtual console stress test complete!");
console.log("Check that scrolling is smooth and UI remains responsive");
