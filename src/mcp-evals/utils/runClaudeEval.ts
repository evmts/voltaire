import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export interface EvalConfig {
  prompt: string;
  mcpServerUrl: string;
  rpcUrl?: string;
  maxTurns?: number;
  timeoutMs?: number;
}

export interface EvalResult {
  success: boolean;
  generatedScript?: string;
  scriptOutput?: string;
  error?: string;
  messages: SDKMessage[];
}

/**
 * Run a Claude eval with MCP server access
 * Extracts generated TypeScript/JavaScript code and executes it
 */
export async function runClaudeEval(config: EvalConfig): Promise<EvalResult> {
  const {
    prompt,
    mcpServerUrl,
    rpcUrl = process.env.ETHEREUM_RPC_URL,
    maxTurns = 15,
    timeoutMs = 5 * 60 * 1000, // 5 minutes default
  } = config;

  const messages: SDKMessage[] = [];
  let generatedScript: string | undefined;
  let scriptOutput: string | undefined;
  let error: string | undefined;

  // Add timeout wrapper
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error(`Eval timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    await Promise.race([
      (async () => {
        // Build the full prompt with RPC context
        const fullPrompt = `${prompt}

${rpcUrl ? `You have access to an Ethereum RPC endpoint via the environment variable ETHEREUM_RPC_URL="${rpcUrl}"` : ""}

Use the Voltaire MCP server tools to accomplish this task. Generate a working TypeScript script that uses Voltaire primitives to get the answer.

Return ONLY the final answer in your last message in this format:
ANSWER: <the answer>`;

        for await (const message of query({
          prompt: fullPrompt,
          options: {
            model: "claude-sonnet-4-5-20250929",
            maxTurns,
            mcpServers: {
              voltaire: {
                command: "npx",
                args: ["-y", "@voltaire/mcp-server"],
                env: {
                  MCP_SERVER_URL: mcpServerUrl,
                  ...(rpcUrl ? { ETHEREUM_RPC_URL: rpcUrl } : {}),
                },
              },
            },
            allowedTools: [
              "mcp__voltaire__*", // All Voltaire MCP tools
              "Read",
              "Write",
              "Bash",
            ],
          },
        })) {
          messages.push(message);

          // Extract generated code from assistant messages
          if (message.type === "assistant" && "content" in message) {
            const content = Array.isArray(message.content)
              ? message.content
                .filter((c: { type: string }) => c.type === "text")
                  .map((c: { text: string }) => c.text)
                  .join("\n")
              : "";

            // Look for code blocks
            const codeBlockMatch = content.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/);
            if (codeBlockMatch) {
              generatedScript = codeBlockMatch[1];
            }

            // Look for the final answer
            const answerMatch = content.match(/ANSWER:\s*(.+)/i);
            if (answerMatch) {
              scriptOutput = answerMatch[1].trim();
            }
          }

          // Check for result message
          if (message.type === "result") {
            if (message.subtype === "error") {
              error = "error" in message ? (message.error as string) : "Unknown error";
            }
            break;
          }
        }
      })(),
      timeoutPromise,
    ]);

    return {
      success: !error && !!scriptOutput,
      generatedScript,
      scriptOutput,
      error,
      messages,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      messages,
    };
  }
}
