import { type Component, createMemo, createSignal, onMount } from 'solid-js'
import Code from '~/components/Code'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Progress, ProgressLabel, ProgressValueLabel } from '~/components/ui/progress'
import { cn } from '~/lib/cn'
import type { EvmState } from '~/lib/types'

interface GasUsageProps {
	state: EvmState
	initialGas?: number
}

const GasUsage: Component<GasUsageProps> = (props) => {
	const [initialGas, setInitialGas] = createSignal(props.initialGas || 1000000)

	onMount(() => {
		if (props.state.gasLeft > 0 && props.state.gasLeft > initialGas()) {
			setInitialGas(props.state.gasLeft)
		}
	})

	const gasUsed = createMemo(() => {
		const init = initialGas()
		const left = props.state.gasLeft
		return init > left ? init - left : 0
	})

	const gasPercentage = createMemo(() => {
		const init = initialGas()
		if (init === 0) return 0
		return ((init - props.state.gasLeft) / init) * 100
	})

	const gasUsageColor = createMemo(() => {
		const percentage = gasPercentage()
		if (percentage < 50) return 'from-green-500 to-green-600'
		if (percentage < 75) return 'from-yellow-500 to-yellow-600'
		if (percentage < 90) return 'from-orange-500 to-orange-600'
		return 'from-red-500 to-red-600'
	})

	return (
		<Card class="overflow-hidden">
			<CardHeader class="border-b p-3">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm">Gas Usage</CardTitle>
					<div class="text-muted-foreground text-xs">
						{gasUsed().toLocaleString()} / {initialGas().toLocaleString()}
					</div>
				</div>
			</CardHeader>
			<CardContent class="p-4">
				<div class="mb-4">
					<Progress value={gasPercentage()} fillClass={cn('bg-gradient-to-r', gasUsageColor())}>
						<div class="mb-1 flex items-center justify-between">
							<ProgressLabel class="text-muted-foreground text-xs">Gas Usage</ProgressLabel>
							<ProgressValueLabel class="font-medium text-xs">{gasPercentage().toFixed(1)}%</ProgressValueLabel>
						</div>
					</Progress>
				</div>

				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<div class="mb-1 text-muted-foreground text-xs uppercase tracking-wider">Initial</div>
						<Code class="font-semibold">{initialGas().toLocaleString()}</Code>
					</div>
					<div>
						<div class="mb-1 text-muted-foreground text-xs uppercase tracking-wider">Used</div>
						<Code class="font-semibold">{gasUsed().toLocaleString()}</Code>
					</div>
					<div>
						<div class="mb-1 text-muted-foreground text-xs uppercase tracking-wider">Remaining</div>
						<Code class="font-semibold">{props.state.gasLeft.toLocaleString()}</Code>
					</div>
				</div>

				<Card class="mt-4 bg-muted/50">
					<CardContent class="p-3">
						<div class="mb-2 font-medium text-xs uppercase tracking-wider">Gas Efficiency Tips</div>
						<div class="space-y-1 text-muted-foreground text-xs">
							<div class="flex items-start gap-2">
								<Badge
									variant={gasPercentage() < 50 ? 'default' : 'secondary'}
									class="flex h-5 w-5 items-center justify-center rounded-full p-0"
								>
									1
								</Badge>
								<span>Storage operations (SSTORE) cost 20,000 gas</span>
							</div>
							<div class="flex items-start gap-2">
								<Badge
									variant={gasPercentage() < 75 ? 'default' : 'secondary'}
									class="flex h-5 w-5 items-center justify-center rounded-full p-0"
								>
									2
								</Badge>
								<span>Memory expansion costs increase quadratically</span>
							</div>
							<div class="flex items-start gap-2">
								<Badge
									variant={gasPercentage() < 90 ? 'default' : 'secondary'}
									class="flex h-5 w-5 items-center justify-center rounded-full p-0"
								>
									3
								</Badge>
								<span>External calls can consume significant gas</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</CardContent>
		</Card>
	)
}

export default GasUsage
