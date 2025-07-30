import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import EvmDebugger from '~/components/evm-debugger/EvmDebugger'
import { Toaster } from '~/components/ui/sonner'

function App() {
	const [isDarkMode, setIsDarkMode] = createSignal(false)

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		setIsDarkMode(mediaQuery.matches)
		const listener = (event: MediaQueryListEvent) => {
			setIsDarkMode(event.matches)
		}
		mediaQuery.addEventListener('change', listener)
		onCleanup(() => {
			mediaQuery.removeEventListener('change', listener)
		})
	})

	createEffect(() => {
		if (isDarkMode()) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	})

	return (
		<>
			<EvmDebugger isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
			<Toaster />
		</>
	)
}

export default App
