export type AgentId = 'router' | 'satellite' | 'advisor' | 'guide' | 'interpreter';

export interface AgentChatRequest {
  message: string;
  sessionId?: string;
  fieldId?: string;
  zoneId?: string;
  /** Contexto de pantalla para explicar datos visibles al usuario. */
  screenContext?: string;
}

export interface AgentChatResponse {
  reply: string;
  agentUsed: AgentId;
  sources: string[];
  suggestedActions: string[];
}

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentToolResult {
  name: string;
  data: unknown;
}

export interface MistralToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}
