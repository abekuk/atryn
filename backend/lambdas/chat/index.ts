import { getAllResources } from "../../shared/data";
import { searchResources } from "../../shared/search";
import { invokeModel } from "../../shared/bedrock";
import { SYSTEM_PROMPT, interestSummaryPrompt } from "../../shared/prompts";
import { ChatRequest, ChatResponse } from "../../shared/types";

export async function handler(event: any) {
  try {
    const body: ChatRequest = JSON.parse(event.body || "{}");
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return response(400, { error: "Message is required" });
    }

    const resources = await getAllResources();
    const matches = searchResources(resources, message, undefined, 6);

    const matchedRecords = matches
      .map((r) => `- ${r.name} (${r.category}): ${r.shortDescription}`)
      .join("\n");

    const prompt = interestSummaryPrompt(message, matchedRecords);

    const aiMessages = [
      ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prompt },
    ];

    const reply = await invokeModel(SYSTEM_PROMPT, aiMessages);

    const result: ChatResponse = {
      reply,
      cards: matches.length > 0 ? matches : undefined,
    };

    return response(200, result);
  } catch (err: any) {
    console.error("Chat handler error:", err);
    return response(500, { error: "Internal server error" });
  }
}

function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}
