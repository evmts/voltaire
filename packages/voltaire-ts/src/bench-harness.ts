/**
 * Shared lightweight benchmark harness for Voltaire TypeScript/Effect suites.
 *
 * Uses calibrated batches with high-resolution nanosecond timing, prints a
 * concise human table, and emits `SMTHRS_BENCH_JSON:` for Smithers `Bench`
 * targets (caching, summaries, and `--compare` delta tables).
 */

export interface BenchMetric {
	name: string;
	unit: "ns/op";
	value: number;
	lowerIsBetter: true;
	meanNs: number;
	medianNs: number;
	minNs: number;
	maxNs: number;
	p75Ns: number;
	p99Ns: number;
	opsPerSec: number;
	samples: number;
}

const nowNs = (): number => {
	const bunNs = (globalThis as { Bun?: { nanoseconds?: () => number } }).Bun
		?.nanoseconds;
	if (typeof bunNs === "function") return bunNs();
	return performance.now() * 1_000_000;
};

const percentile = (sorted: number[], p: number): number => {
	if (sorted.length === 0) return 0;
	const idx = Math.min(
		sorted.length - 1,
		Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
	);
	return sorted[idx]!;
};

export interface BenchCase {
	name: string;
	fn: () => unknown;
}

export async function runBenchSuite(
	suite: string,
	cases: readonly BenchCase[],
	options: { samples?: number; sampleTargetMs?: number } = {},
): Promise<BenchMetric[]> {
	const samples = options.samples ?? 15;
	const targetNs = (options.sampleTargetMs ?? 2) * 1_000_000;
	const metrics: BenchMetric[] = [];

	for (const c of cases) {
		// Warmup
		let sink: unknown;
		for (let i = 0; i < 50; i += 1) {
			const r = c.fn();
			if (r instanceof Promise) sink = await r;
			else sink = r;
		}
		// Calibrate batch size
		const calStart = nowNs();
		let calIters = 0;
		const isAsync = c.fn() instanceof Promise;
		if (isAsync) {
			while (nowNs() - calStart < targetNs && calIters < 5000) {
				sink = await c.fn();
				calIters += 1;
			}
		} else {
			while (nowNs() - calStart < targetNs && calIters < 200_000) {
				sink = c.fn();
				calIters += 1;
			}
		}
		const batch = Math.max(1, Math.floor(calIters / 2));
		const times: number[] = [];
		for (let s = 0; s < samples; s += 1) {
			const t0 = nowNs();
			if (isAsync) {
				for (let j = 0; j < batch; j += 1) sink = await c.fn();
			} else {
				for (let j = 0; j < batch; j += 1) sink = c.fn();
			}
			times.push((nowNs() - t0) / batch);
		}
		void sink;
		const sorted = [...times].sort((a, b) => a - b);
		const meanNs = times.reduce((a, b) => a + b, 0) / times.length;
		const medianNs = percentile(sorted, 50);
		const minNs = sorted[0]!;
		const maxNs = sorted[sorted.length - 1]!;
		const p75Ns = percentile(sorted, 75);
		const p99Ns = percentile(sorted, 99);
		metrics.push({
			name: c.name,
			unit: "ns/op",
			value: Number(meanNs.toFixed(3)),
			lowerIsBetter: true,
			meanNs: Number(meanNs.toFixed(3)),
			medianNs: Number(medianNs.toFixed(3)),
			minNs: Number(minNs.toFixed(3)),
			maxNs: Number(maxNs.toFixed(3)),
			p75Ns: Number(p75Ns.toFixed(3)),
			p99Ns: Number(p99Ns.toFixed(3)),
			opsPerSec: meanNs > 0 ? Math.round(1_000_000_000 / meanNs) : 0,
			samples,
		});
	}

	const report = { suite, runtime: "bun", metrics };
	process.stdout.write(`SMTHRS_BENCH_JSON:${JSON.stringify(report)}\n`);
	return metrics;
}
