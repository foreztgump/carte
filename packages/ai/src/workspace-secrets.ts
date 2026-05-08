export type LlmProvider = "anthropic" | "openai" | "gemini";

export interface WorkspaceSecretParams {
  workspaceId: string;
  provider: LlmProvider;
  secrets: Map<string, string>;
}

interface StoreWorkspaceSecretParams extends WorkspaceSecretParams {
  value: string;
}

export async function storeWorkspaceLlmKey(params: StoreWorkspaceSecretParams): Promise<void> {
  params.secrets.set(secretName(params.workspaceId, params.provider), params.value);
}

export async function readWorkspaceLlmKey(params: WorkspaceSecretParams): Promise<string | null> {
  return params.secrets.get(secretName(params.workspaceId, params.provider)) ?? null;
}

function secretName(workspaceId: string, provider: LlmProvider): string {
  return `secret:${workspaceId}:llm:${provider}`;
}
