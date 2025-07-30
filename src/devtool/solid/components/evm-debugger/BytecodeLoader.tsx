import UploadIcon from 'lucide-solid/icons/upload'
import { type Component, createSignal, type Setter } from 'solid-js'
import type { EvmState } from '~/components/evm-debugger/types'
import { sampleContracts } from '~/components/evm-debugger/types'
import { loadBytecode, resetEvm } from '~/components/evm-debugger/utils'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxTrigger } from '~/components/ui/combobox'
import { TextArea } from '~/components/ui/textarea'
import { TextFieldRoot } from '~/components/ui/textfield'

interface BytecodeLoaderProps {
	bytecode: string
	setBytecode: Setter<string>
	setError: Setter<string>
	setIsRunning: Setter<boolean>
	setState: Setter<EvmState>
}

const BytecodeLoader: Component<BytecodeLoaderProps> = (props) => {
	const [selectedContract, setSelectedContract] = createSignal('')

	const handleLoadBytecode = async () => {
		try {
			props.setError('')
			await loadBytecode(props.bytecode)
			props.setIsRunning(false)
			const state = await resetEvm()
			props.setState(state)
		} catch (err) {
			props.setError(`${err}`)
		}
	}

	return (
		<Card class="mx-auto mt-6 max-w-7xl rounded-sm border-none bg-transparent shadow-none">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<div class="space-y-1">
					<CardTitle>Bytecode</CardTitle>
					<CardDescription>Enter EVM bytecode to debug or select a sample contract</CardDescription>
				</div>
				<Combobox
					value={selectedContract()}
					onChange={(value) => {
						setSelectedContract(value || '')
						const contract = sampleContracts.find((c) => c.name === value)
						if (contract) {
							props.setBytecode(contract.bytecode)
						}
					}}
					options={sampleContracts.map((c) => c.name)}
					placeholder="Select sample contract"
					itemComponent={(props) => (
						<ComboboxItem item={props.item}>
							<div class="flex flex-col items-start">
								<span class="font-medium">{props.item.rawValue}</span>
								<span class="text-muted-foreground text-xs">
									{sampleContracts.find((c) => c.name === props.item.rawValue)?.description}
								</span>
							</div>
						</ComboboxItem>
					)}
				>
					<ComboboxTrigger class="w-[250px]" aria-label="Select sample contract">
						<div class="flex items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-1.5 h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<title>File icon</title>
								<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
								<polyline points="14 2 14 8 20 8" />
							</svg>
							<ComboboxInput placeholder="Select sample contract" />
						</div>
					</ComboboxTrigger>
					<ComboboxContent />
				</Combobox>
			</CardHeader>
			<CardContent class="flex flex-col gap-2">
				<TextFieldRoot>
					<TextArea
						id="bytecode"
						value={props.bytecode}
						onInput={(e) => props.setBytecode(e.currentTarget.value)}
						class="h-24 font-mono"
						placeholder="0x608060405234801561001057600080fd5b50..."
						aria-label="EVM bytecode input"
					/>
				</TextFieldRoot>
				<Button variant="secondary" size="sm" onClick={handleLoadBytecode} aria-label="Load bytecode" class="gap-2">
					<UploadIcon class="h-4 w-4" />
					Load Bytecode
				</Button>
			</CardContent>
		</Card>
	)
}

export default BytecodeLoader
