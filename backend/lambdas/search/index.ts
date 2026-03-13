import { getAllResources } from "../../shared/data";
import { searchResources } from "../../shared/search";
import { invokeModel } from "../../shared/bedrock";
import { SYSTEM_PROMPT, searchResponsePrompt } from "../../shared/prompts";
import { SearchRequest, SearchResponse } from "../../shared/types";

export async function handler(event: any) {
  try {
    const body: SearchRequest = JSON.parse(event.body || "{}");
    const { query, category, limit = 5 } = body;

    if (!query) {
      return response(400, { error: "Query is required" });
    }

    const resources = await getAllResources();
    const results = searchResources(resources, query, category, limit);

    const matchedRecords = results
      .map((r) => `- ${r.name} (${r.category}): ${r.shortDescription}`)
      .join("\n");

    const summary = await invokeModel(SYSTEM_PROMPT, [
      { role: "user", content: searchResponsePrompt(query, matchedRecords) },
    ]);

    const result: SearchResponse = { results, summary };
    return response(200, result);
  } catch (err: any) {
    console.error("Search handler error:", err);
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
