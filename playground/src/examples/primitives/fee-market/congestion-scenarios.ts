import { FeeMarket } from "@tevm/voltaire";
// Example: Network congestion scenarios
// Shows how fee market responds to demand spikes and recovery

const gasLimit = 30_000_000n;

let state: FeeMarket.State = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 1_000_000_000n, // Normal: 1 gwei
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};
for (let i = 0; i < 5; i++) {
	state = { ...state, gasUsed: gasLimit };
	state = FeeMarket.nextState(state);
}
for (let i = 0; i < 5; i++) {
	state = { ...state, gasUsed: gasLimit / 2n };
	state = FeeMarket.nextState(state);
}

state = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};
for (let i = 0; i < 20; i++) {
	state = { ...state, gasUsed: (gasLimit * 75n) / 100n };
	state = FeeMarket.nextState(state);

	if (i % 4 === 0 || i === 19) {
	}
}

state = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 5_000_000_000n, // High starting fee
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};
for (let i = 0; i < 10; i++) {
	state = { ...state, gasUsed: (gasLimit * 10n) / 100n };
	state = FeeMarket.nextState(state);

	if (i % 2 === 0 || i === 9) {
	}
}

state = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

// Alternate between high and low
const pattern = [90n, 20n, 85n, 25n, 90n, 15n];
for (let i = 0; i < pattern.length; i++) {
	const utilizationPct = pattern[i];
	state = { ...state, gasUsed: (gasLimit * utilizationPct) / 100n };
	state = FeeMarket.nextState(state);
}
