import { getResourceById } from "../../shared/data";
import { invokeModel } from "../../shared/bedrock";
import { SYSTEM_PROMPT, emailDraftPrompt } from "../../shared/prompts";
import { EmailDraftRequest, EmailDraftResponse } from "../../shared/types";

export async function handler(event: any) {
  try {
    const id = event.pathParameters?.id;
    const body: EmailDraftRequest = JSON.parse(event.body || "{}");

    if (!id) {
      return response(400, { error: "Resource ID is required" });
    }

    const resource = await getResourceById(id);
    if (!resource) {
      return response(404, { error: "Resource not found" });
    }

    const recordStr = JSON.stringify(resource, null, 2);
    const draft = await invokeModel(SYSTEM_PROMPT, [
      { role: "user", content: emailDraftPrompt(recordStr, body.studentContext) },
    ]);

    // Parse subject and body from the AI response
    const subjectMatch = draft.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : "Interest in Your Work";
    const emailBody = draft.replace(/Subject:\s*.+\n*/i, "").trim();

    const result: EmailDraftResponse = { subject, body: emailBody };
    return response(200, result);
  } catch (err: any) {
    console.error("Email draft handler error:", err);
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
