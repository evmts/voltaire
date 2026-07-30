'use client'

import { useEffect, useMemo, useState } from 'react'

type Bindings = {
	Keccak256: typeof import('@tevm/voltaire/Keccak256')
	Hex: typeof import('@tevm/voltaire/Hex')
	Address: typeof import('@tevm/voltaire/Address/functional')
	Rlp: typeof import('@tevm/voltaire/Rlp')
}

type Mode = 'hash' | 'address' | 'rlp'

const modes: Array<{ id: Mode; label: string; hint: string; placeholder: string }> = [
	{ id: 'hash', label: 'Keccak-256', hint: 'Plain text, or 0x-prefixed hex bytes', placeholder: 'Voltaire' },
	{
		id: 'address',
		label: 'Address',
		hint: 'A 20-byte address, in any casing',
		placeholder: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
	},
	{ id: 'rlp', label: 'RLP', hint: 'Comma-separated hex items to encode as a list', placeholder: '0xcafe, 0x01, 0x' },
]

const toBytes = (value: string): Uint8Array => {
	if (!value.startsWith('0x')) return new TextEncoder().encode(value)
	const digits = value.slice(2)
	const padded = digits.length % 2 === 0 ? digits : `0${digits}`
	if (padded && !/^[0-9a-fA-F]+$/.test(padded)) throw new Error(`Not valid hex: ${value}`)
	return Uint8Array.from(padded.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
}

type Row = { label: string; value: string }

const run = (bindings: Bindings, mode: Mode, input: string): Row[] => {
	const { Keccak256, Hex, Address, Rlp } = bindings

	if (mode === 'hash') {
		const bytes = toBytes(input)
		return [
			{ label: 'input', value: `${bytes.length} bytes · ${input.startsWith('0x') ? 'hex' : 'utf-8'}` },
			{ label: 'keccak256', value: Hex.fromBytes(Keccak256.hash(bytes)) },
		]
	}

	if (mode === 'address') {
		const trimmed = input.trim()
		const address = Address.fromHex(trimmed as `0x${string}`)
		return [
			{ label: 'checksummed (EIP-55)', value: Address.toChecksummed(address) },
			{ label: 'input checksum valid', value: String(Address.isValidChecksum(trimmed)) },
			{ label: 'CREATE at nonce 0', value: Address.toChecksummed(Address.calculateCreateAddress(address, 0n)) },
		]
	}

	const items = input
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map(toBytes)
	const encoded = Rlp.encode(items)
	const decoded = Rlp.decode(encoded).data
	const roundTrip =
		decoded.type === 'list'
			? (decoded.value as Array<{ value: Uint8Array }>).map((item) => Hex.fromBytes(item.value)).join(', ')
			: Hex.fromBytes(decoded.value as Uint8Array)
	return [
		{ label: 'rlp encoded', value: Hex.fromBytes(encoded) },
		{ label: 'encoded size', value: `${encoded.length} bytes` },
		{ label: 'decoded back', value: roundTrip },
	]
}

export function Playground() {
	const [bindings, setBindings] = useState<Bindings | null>(null)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [mode, setMode] = useState<Mode>('hash')
	const [input, setInput] = useState(modes[0].placeholder)

	useEffect(() => {
		let cancelled = false
		Promise.all([
			import('@tevm/voltaire/Keccak256'),
			import('@tevm/voltaire/Hex'),
			import('@tevm/voltaire/Address/functional'),
			import('@tevm/voltaire/Rlp'),
		])
			.then(([Keccak256, Hex, Address, Rlp]) => {
				if (!cancelled) setBindings({ Keccak256, Hex, Address, Rlp } as Bindings)
			})
			.catch((error) => {
				if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error))
			})
		return () => {
			cancelled = true
		}
	}, [])

	const result = useMemo(() => {
		if (!bindings) return null
		try {
			return { rows: run(bindings, mode, input), error: null as string | null }
		} catch (error) {
			return { rows: [] as Row[], error: error instanceof Error ? error.message : String(error) }
		}
	}, [bindings, mode, input])

	const activeMode = modes.find((entry) => entry.id === mode) ?? modes[0]

	return (
		<section className="vlt-playground" aria-label="Voltaire primitive playground">
			<header className="vlt-playground__head">
				<div>
					<p className="vlt-playground__eyebrow">Runs in your browser</p>
					<h3 className="vlt-playground__title">Primitive playground</h3>
				</div>
				<span className="vlt-playground__badge">@tevm/voltaire</span>
			</header>

			<div className="vlt-playground__tabs" role="tablist" aria-label="Primitive">
				{modes.map((entry) => (
					<button
						key={entry.id}
						type="button"
						role="tab"
						aria-selected={entry.id === mode}
						className="vlt-playground__tab"
						onClick={() => {
							setMode(entry.id)
							setInput(entry.placeholder)
						}}
					>
						{entry.label}
					</button>
				))}
			</div>

			<label className="vlt-playground__label" htmlFor="vlt-playground-input">
				{activeMode.hint}
			</label>
			<input
				id="vlt-playground-input"
				className="vlt-playground__input"
				spellCheck={false}
				autoComplete="off"
				value={input}
				placeholder={activeMode.placeholder}
				onChange={(event) => setInput(event.target.value)}
			/>

			<div className="vlt-playground__output">
				{loadError ? (
					<p className="vlt-playground__error">Could not load the bindings: {loadError}</p>
				) : !bindings ? (
					<p className="vlt-playground__muted">Loading bindings…</p>
				) : result?.error ? (
					<p className="vlt-playground__error">{result.error}</p>
				) : (
					result?.rows.map((row) => (
						<div className="vlt-playground__row" key={row.label}>
							<span className="vlt-playground__row-label">{row.label}</span>
							<code className="vlt-playground__row-value">{row.value}</code>
						</div>
					))
				)}
			</div>

			<p className="vlt-playground__footnote">
				{'This is the published package running client-side — the same functions documented in '}
				<a href="/guides/hashing">Hashing</a>
				{', '}
				<a href="/guides/addresses">Addresses</a>
				{' and '}
				<a href="/guides/rlp">RLP</a>
				{'.'}
			</p>
		</section>
	)
}
