import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import EvmDebugger from "~/components/evm-debugger/EvmDebugger";
import { Toaster } from "~/components/ui/sonner";
import { resetEvm, stepEvm } from "~/lib/actions";
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

	onMount(() => {
		window.handleRunPause = handleRunPause;
		window.handleStep = handleStep;
		window.handleReset = handleReset;

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
