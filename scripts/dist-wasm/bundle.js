let i = null;
let o = null;
let s = 0;
async function l() {
	if (i) return;
	const e = await fetch(
		new URL("../wasm/crypto/keccak256.wasm", import.meta.url),
	).then((r) => r.arrayBuffer());
	(o = new WebAssembly.Memory({ initial: 1, maximum: 1 })),
		(i = (await WebAssembly.instantiate(e, { env: { memory: o } })).instance);
}
function c(e) {
	if (!o) throw new Error("WASM not initialized");
	const t = s;
	if (((s += e), s > o.buffer.byteLength))
		throw new Error("Out of WASM memory");
	return t;
}
async function u(e) {
	await l();
	const t = i.exports;
	const r = c(e.length);
	const n = c(32);
	const a = new Uint8Array(t.memory.buffer);
	a.set(e, r), t.keccak256Hash(r, e.length, n);
	const m = new Uint8Array(32);
	return m.set(a.subarray(n, n + 32)), (s = 0), m;
}
async function y(e) {
	const t = new TextEncoder().encode(e);
	return u(t);
}
async function b(e) {
	const t = e.startsWith("0x") ? e.slice(2) : e;
	const r = new Uint8Array(t.length / 2);
	for (let n = 0; n < t.length; n += 2)
		r[n / 2] = Number.parseInt(t.slice(n, n + 2), 16);
	return u(r);
}
export { u as hash, b as hashHex, y as hashString };
