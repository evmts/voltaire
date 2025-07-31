import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import EvmDebugger from "~/components/evm-debugger/EvmDebugger";
import { Toaster } from "~/components/ui/sonner";
import { loadBytecode, resetEvm, stepEvm } from "~/lib/actions";
import type { EvmState } from "./components/evm-debugger/types";
import { sampleContracts } from "./components/evm-debugger/types";

declare global {
	interface Window {
		hello_world: (name: string) => Promise<string>;
		load_bytecode: (bytecode: string) => Promise<string>;
		reset_evm: () => Promise<string>;
		step_evm: () => Promise<string>;
		get_evm_state: () => Promise<string>;
		handleRunPause: () => void;
		handleStep: () => void;
		handleReset: () => void;
	}
}

function App() {
	const [isDarkMode, setIsDarkMode] = createSignal(false);
	const [isRunning, setIsRunning] = createSignal(false);
	const [error, setError] = createSignal<string>("");
	const [bytecode, setBytecode] = createSignal(sampleContracts[7].bytecode);
	const [state, setState] = createStore<EvmState>({
		pc: 0,
		opcode: "-",
		gasLeft: 0,
		depth: 0,
		stack: [],
		memory: "0x",
		storage: [],
		logs: [],
		returnData: "0x",
	});

	const handleRunPause = () => {
		setIsRunning(!isRunning());
	};

	const handleStep = async () => {
		try {
			setError("");
			const newState = await stepEvm();
			setState(newState);
		} catch (err) {
			setError(`${err}`);
		}
	};

	const handleReset = async () => {
		try {
			setError("");
			setIsRunning(false);
			const newState = await resetEvm();
			setState(newState);
		} catch (err) {
			setError(`${err}`);
		}
	};

	onMount(async () => {
		window.handleRunPause = handleRunPause;
		window.handleStep = handleStep;
		window.handleReset = handleReset;

		// Wait for WebUI bindings to be ready, then load initial bytecode
		const loadInitialBytecode = async () => {
			// Check if WebUI functions are available
			if (
				typeof window.load_bytecode === "function" &&
				typeof window.reset_evm === "function"
			) {
				try {
					await loadBytecode(bytecode());
					const initialState = await resetEvm();
					setState(initialState);
				} catch (err) {
					setError(`Failed to load initial bytecode: ${err}`);
				}
			} else {
				// Retry after a short delay
				setTimeout(loadInitialBytecode, 100);
			}
		};

		// Start the initial loading process
		setTimeout(loadInitialBytecode, 100);

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.code === "Space") {
				event.preventDefault();
				handleRunPause();
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		setIsDarkMode(mediaQuery.matches);
		const listener = (event: MediaQueryListEvent) => {
			setIsDarkMode(event.matches);
		};
		mediaQuery.addEventListener("change", listener);
		onCleanup(() => {
			window.removeEventListener("keydown", handleKeyDown);
			mediaQuery.removeEventListener("change", listener);
		});
	});

	createEffect(() => {
		if (isRunning() && bytecode()) {
			const intervalId = setInterval(async () => {
				try {
					const newState = await stepEvm();
					if (newState.pc === 0 && newState.opcode === "COMPLETE") {
						setIsRunning(false);
					}
					setState(newState);
				} catch (err) {
					setError(`${err}`);
					setIsRunning(false);
				}
			}, 200);
			onCleanup(() => {
				clearInterval(intervalId);
			});
		}
	});

	createEffect(() => {
		if (isDarkMode()) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	});

	return (
		<>
			<EvmDebugger
				isDarkMode={isDarkMode}
				setIsDarkMode={setIsDarkMode}
				isRunning={isRunning}
				setIsRunning={setIsRunning}
				error={error}
				setError={setError}
				state={state}
				setState={setState}
				bytecode={bytecode}
				setBytecode={setBytecode}
				handleRunPause={handleRunPause}
				handleStep={handleStep}
				handleReset={handleReset}
			/>
			<Toaster />
		</>
	);
}

export default App;
