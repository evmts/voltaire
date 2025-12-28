import { Hardfork } from "voltaire";
const london = Hardfork.LONDON;

// Check if hardfork is pre or post London
const checkLondonStatus = (fork: string) => {
	const f = Hardfork.fromString(fork);
	if (!f) return "unknown";
	return Hardfork.isAtLeast(f, london) ? "post-London" : "pre-London";
};
