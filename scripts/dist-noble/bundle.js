const x = BigInt(4294967295);
const k = BigInt(32);
function X(t, e = !1) {
	return e
		? { h: Number(t & x), l: Number((t >> k) & x) }
		: { h: Number((t >> k) & x) | 0, l: Number(t & x) | 0 };
}
function L(t, e = !1) {
	const n = t.length;
	const o = new Uint32Array(n);
	const s = new Uint32Array(n);
	for (let i = 0; i < n; i++) {
		const { h: r, l: c } = X(t[i], e);
		[o[i], s[i]] = [r, c];
	}
	return [o, s];
}
const _ = (t, e, n) => (t << n) | (e >>> (32 - n));
const m = (t, e, n) => (e << n) | (t >>> (32 - n));
const B = (t, e, n) => (e << (n - 32)) | (t >>> (64 - n));
const I = (t, e, n) => (t << (n - 32)) | (e >>> (64 - n));
function R(t) {
	return (
		t instanceof Uint8Array ||
		(ArrayBuffer.isView(t) && t.constructor.name === "Uint8Array")
	);
}
function y(t, e = "") {
	if (!Number.isSafeInteger(t) || t < 0) {
		const n = e && `"${e}" `;
		throw new Error(`${n}expected integer >= 0, got ${t}`);
	}
}
function l(t, e, n = "") {
	const o = R(t);
	const s = t?.length;
	const i = e !== void 0;
	if (!o || (i && s !== e)) {
		const r = n && `"${n}" `;
		const c = i ? ` of length ${e}` : "";
		const u = o ? `length=${s}` : `type=${typeof t}`;
		throw new Error(`${r}expected Uint8Array${c}, got ${u}`);
	}
	return t;
}
function g(t, e = !0) {
	if (t.destroyed) throw new Error("Hash instance has been destroyed");
	if (e && t.finished) throw new Error("Hash#digest() has already been called");
}
function H(t, e) {
	l(t, void 0, "digestInto() output");
	const n = e.outputLen;
	if (t.length < n)
		throw new Error(`"digestInto() output" expected to be of length >=${n}`);
}
function O(t) {
	return new Uint32Array(t.buffer, t.byteOffset, Math.floor(t.byteLength / 4));
}
function w(...t) {
	for (let e = 0; e < t.length; e++) t[e].fill(0);
}
const M = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
function D(t) {
	return (
		((t << 24) & 4278190080) |
		((t << 8) & 16711680) |
		((t >>> 8) & 65280) |
		((t >>> 24) & 255)
	);
}
function P(t) {
	for (let e = 0; e < t.length; e++) t[e] = D(t[e]);
	return t;
}
const b = M ? (t) => t : P;
function U(t, e = {}) {
	const n = (s, i) => t(i).update(s).digest();
	const o = t(void 0);
	return (
		(n.outputLen = o.outputLen),
		(n.blockLen = o.blockLen),
		(n.create = (s) => t(s)),
		Object.assign(n, e),
		Object.freeze(n)
	);
}
const z = BigInt(0);
const a = BigInt(1);
const C = BigInt(2);
const K = BigInt(7);
const W = BigInt(256);
const q = BigInt(113);
const T = [];
const j = [];
const F = [];
for (let t = 0, e = a, n = 1, o = 0; t < 24; t++) {
	([n, o] = [o, (2 * n + 3 * o) % 5]),
		T.push(2 * (5 * o + n)),
		j.push((((t + 1) * (t + 2)) / 2) % 64);
	let s = z;
	for (let i = 0; i < 7; i++)
		(e = ((e << a) ^ ((e >> K) * q)) % W),
			e & C && (s ^= a << ((a << BigInt(i)) - a));
	F.push(s);
}
const N = L(F, !0);
const G = N[0];
const J = N[1];
const S = (t, e, n) => (n > 32 ? B(t, e, n) : _(t, e, n));
const E = (t, e, n) => (n > 32 ? I(t, e, n) : m(t, e, n));
function Q(t, e = 24) {
	const n = new Uint32Array(10);
	for (let o = 24 - e; o < 24; o++) {
		for (let r = 0; r < 10; r++)
			n[r] = t[r] ^ t[r + 10] ^ t[r + 20] ^ t[r + 30] ^ t[r + 40];
		for (let r = 0; r < 10; r += 2) {
			const c = (r + 8) % 10;
			const u = (r + 2) % 10;
			const h = n[u];
			const f = n[u + 1];
			const $ = S(h, f, 1) ^ n[c];
			const V = E(h, f, 1) ^ n[c + 1];
			for (let p = 0; p < 50; p += 10) (t[r + p] ^= $), (t[r + p + 1] ^= V);
		}
		let s = t[2];
		let i = t[3];
		for (let r = 0; r < 24; r++) {
			const c = j[r];
			const u = S(s, i, c);
			const h = E(s, i, c);
			const f = T[r];
			(s = t[f]), (i = t[f + 1]), (t[f] = u), (t[f + 1] = h);
		}
		for (let r = 0; r < 50; r += 10) {
			for (let c = 0; c < 10; c++) n[c] = t[r + c];
			for (let c = 0; c < 10; c++)
				t[r + c] ^= ~n[(c + 2) % 10] & n[(c + 4) % 10];
		}
		(t[0] ^= G[o]), (t[1] ^= J[o]);
	}
	w(n);
}
const A = class t {
	state;
	pos = 0;
	posOut = 0;
	finished = !1;
	state32;
	destroyed = !1;
	blockLen;
	suffix;
	outputLen;
	enableXOF = !1;
	rounds;
	constructor(e, n, o, s = !1, i = 24) {
		if (
			((this.blockLen = e),
			(this.suffix = n),
			(this.outputLen = o),
			(this.enableXOF = s),
			(this.rounds = i),
			y(o, "outputLen"),
			!(0 < e && e < 200))
		)
			throw new Error("only keccak-f1600 function is supported");
		(this.state = new Uint8Array(200)), (this.state32 = O(this.state));
	}
	clone() {
		return this._cloneInto();
	}
	keccak() {
		b(this.state32),
			Q(this.state32, this.rounds),
			b(this.state32),
			(this.posOut = 0),
			(this.pos = 0);
	}
	update(e) {
		g(this), l(e);
		const { blockLen: n, state: o } = this;
		const s = e.length;
		for (let i = 0; i < s; ) {
			const r = Math.min(n - this.pos, s - i);
			for (let c = 0; c < r; c++) o[this.pos++] ^= e[i++];
			this.pos === n && this.keccak();
		}
		return this;
	}
	finish() {
		if (this.finished) return;
		this.finished = !0;
		const { state: e, suffix: n, pos: o, blockLen: s } = this;
		(e[o] ^= n),
			(n & 128) !== 0 && o === s - 1 && this.keccak(),
			(e[s - 1] ^= 128),
			this.keccak();
	}
	writeInto(e) {
		g(this, !1), l(e), this.finish();
		const n = this.state;
		const { blockLen: o } = this;
		for (let s = 0, i = e.length; s < i; ) {
			this.posOut >= o && this.keccak();
			const r = Math.min(o - this.posOut, i - s);
			e.set(n.subarray(this.posOut, this.posOut + r), s),
				(this.posOut += r),
				(s += r);
		}
		return e;
	}
	xofInto(e) {
		if (!this.enableXOF)
			throw new Error("XOF is not possible for this instance");
		return this.writeInto(e);
	}
	xof(e) {
		return y(e), this.xofInto(new Uint8Array(e));
	}
	digestInto(e) {
		if ((H(e, this), this.finished))
			throw new Error("digest() was already called");
		return this.writeInto(e), this.destroy(), e;
	}
	digest() {
		return this.digestInto(new Uint8Array(this.outputLen));
	}
	destroy() {
		(this.destroyed = !0), w(this.state);
	}
	_cloneInto(e) {
		const {
			blockLen: n,
			suffix: o,
			outputLen: s,
			rounds: i,
			enableXOF: r,
		} = this;
		return (
			(e ||= new t(n, o, s, r, i)),
			e.state32.set(this.state32),
			(e.pos = this.pos),
			(e.posOut = this.posOut),
			(e.finished = this.finished),
			(e.rounds = i),
			(e.suffix = o),
			(e.outputLen = s),
			(e.enableXOF = r),
			(e.destroyed = this.destroyed),
			e
		);
	}
};
const Y = (t, e, n, o = {}) => U(() => new A(e, t, n), o);
const d = Y(1, 136, 32);
function st(t) {
	return d(t);
}
function it(t) {
	const e = new TextEncoder().encode(t);
	return d(e);
}
function ct(t) {
	const e = t.startsWith("0x") ? t.slice(2) : t;
	const n = new Uint8Array(e.length / 2);
	for (let o = 0; o < e.length; o += 2)
		n[o / 2] = Number.parseInt(e.slice(o, o + 2), 16);
	return d(n);
}
export { st as hash, ct as hashHex, it as hashString };
/*! Bundled license information:

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
