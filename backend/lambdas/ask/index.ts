import { getResourceById } from "../../shared/data";
import { invokeModel } from "../../shared/bedrock";
import { SYSTEM_PROMPT, itemQAPrompt } from "../../shared/prompts";
import { AskRequest, AskResponse } from "../../shared/types";

export async function handler(event: any) {
  try {
    const id = event.pathParameters?.id;
    const body: AskRequest = JSON.parse(event.body || "{}");
    const { question } = body;

    if (!id || !question) {
      return response(400, { error: "Resource ID and question are required" });
    }

    const resource = await getResourceById(id);
    if (!resource) {
      return response(404, { error: "Resource not found" });
    }

    const recordStr = JSON.stringify(resource, null, 2);
    const answer = await invokeModel(SYSTEM_PROMPT, [
      { role: "user", content: itemQAPrompt(question, recordStr) },
    ]);

    const result: AskResponse = { answer };
    return response(200, result);
  } catch (err: any) {
    console.error("Ask handler error:", err);
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
