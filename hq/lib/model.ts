export type ModelMessage = { role: "system" | "user"; content: string };

export function modelStatus() {
  const baseUrl = process.env.HQ_MODEL_BASE_URL?.trim();
  const model = process.env.HQ_MODEL_NAME?.trim();
  return {
    configured: Boolean(baseUrl && model),
    baseUrl: baseUrl || undefined,
    model: model || undefined,
  };
}

export async function completeWithModel(messages: ModelMessage[]): Promise<string | null> {
  const baseUrl = process.env.HQ_MODEL_BASE_URL?.trim();
  const model = process.env.HQ_MODEL_NAME?.trim();
  const apiKey = process.env.HQ_MODEL_API_KEY?.trim();
  if (!baseUrl || !model) return null;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.2 }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Model gateway ${response.status}: ${body.slice(0, 280)}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content?.trim() || null;
}