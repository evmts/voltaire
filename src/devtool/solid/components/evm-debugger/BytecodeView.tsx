import { type Component, For, Show, createMemo } from "solid-js";
import { opcodeToString } from "~/components/evm-debugger/utils";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import Code from "~/components/Code";

interface BytecodeViewProps {
	bytecode: string;
	pc: number;
}

interface DisassembledInstruction {
	offset: number;
	opcode: string;
	hex: string;
	push?: string;
}

const disassembleBytecode = (bytecode: string): DisassembledInstruction[] => {
	const instructions: DisassembledInstruction[] = [];
	const bytes = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;

	let i = 0;
	while (i < bytes.length) {
		const offset = i / 2;
		const opcodeByte = parseInt(bytes.slice(i, i + 2), 16);
		const opcodeName = opcodeToString(opcodeByte);

		const instruction: DisassembledInstruction = {
			offset,
			opcode: opcodeName,
			hex: bytes.slice(i, i + 2),
		};

		// Handle PUSH instructions
		if (opcodeByte >= 0x60 && opcodeByte <= 0x7f) {
			const pushSize = opcodeByte - 0x5f;
			const pushData = bytes.slice(i + 2, i + 2 + pushSize * 2);
			instruction.push = pushData;
			i += pushSize * 2;
		}

		instructions.push(instruction);
		i += 2;
	}

	return instructions;
};

const BytecodeView: Component<BytecodeViewProps> = (props) => {
	const instructions = createMemo(() => disassembleBytecode(props.bytecode));

	const currentInstructionIndex = createMemo(() => {
		const instrs = instructions();
		return instrs.findIndex((instr) => instr.offset === props.pc);
	});

	return (
		<Card class="overflow-hidden">
			<CardHeader class="p-3 border-b">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm">Bytecode Disassembly</CardTitle>
					<div class="text-muted-foreground text-xs">
						{instructions().length} instructions
					</div>
				</div>
			</CardHeader>
			<CardContent class="p-0 max-h-[400px] overflow-y-auto">
				<Table>
					<TableHeader class="sticky top-0 bg-background z-10">
						<TableRow>
							<TableHead class="text-xs uppercase">Offset</TableHead>
							<TableHead class="text-xs uppercase">Opcode</TableHead>
							<TableHead class="text-xs uppercase">Hex</TableHead>
							<TableHead class="text-xs uppercase">Data</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<For each={instructions()}>
							{(instruction, index) => (
								<TableRow
									class={
										index() === currentInstructionIndex() ? "bg-accent/50" : ""
									}
								>
									<TableCell>
										<Code class="text-xs">
											0x{instruction.offset.toString(16).padStart(4, "0")}
										</Code>
									</TableCell>
									<TableCell>
										<Show
											when={index() === currentInstructionIndex()}
											fallback={
												<span class="font-mono text-sm">
													{instruction.opcode}
												</span>
											}
										>
											<Code variant="default">{instruction.opcode}</Code>
										</Show>
									</TableCell>
									<TableCell>
										<Code class="text-xs">0x{instruction.hex}</Code>
									</TableCell>
									<TableCell>
										<Show when={instruction.push}>
											<Code class="text-xs">0x{instruction.push}</Code>
										</Show>
									</TableCell>
								</TableRow>
							)}
						</For>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
};

export default BytecodeView;
