// Log 10,000 entries
for (let i = 0; i < 10000; i++) {
	if (i % 1000 === 0) {
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
	}
}
