import { NextRequest, NextResponse } from "next/server";
import { getAllLabs } from "@/lib/dynamodb";

const MOCK_MODE = process.env.MOCK_AI === "true";

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Get labs from DynamoDB for context
    const labs = await getAllLabs();

    // Search labs by keyword matching
    const tokens = message.toLowerCase().split(/\s+/).filter(Boolean);
    const matchedLabs = labs.filter((lab: Record<string, unknown>) => {
      const searchable = [
        lab.labName as string,
        lab.topics as string,
        lab.description as string,
        lab.department as string,
        lab.professorName as string || "",
      ].join(" ").toLowerCase();
      return tokens.some((t: string) => searchable.includes(t));
    }).slice(0, 4);

    if (MOCK_MODE) {
      const reply = matchedLabs.length > 0
        ? `I found ${matchedLabs.length} research labs that match your interests. Check out the results below and click any lab to learn more!`
        : `I can help you discover research labs, professors, and topics at U of T. Try asking about specific areas like "machine learning", "robotics", "cybersecurity", or "biomedical AI".`;

      return NextResponse.json({
        reply,
        labs: matchedLabs.length > 0 ? matchedLabs : undefined,
      });
    }

    // Call AWS Bedrock Converse API
    const { BedrockRuntimeClient, ConverseCommand } = await import(
      "@aws-sdk/client-bedrock-runtime"
    );

    const labContext = labs.map((l: Record<string, unknown>) =>
      `- ${l.labName} (${l.department}): ${l.description} Topics: ${l.topics}. Professor: ${l.professorName}`
    ).join("\n");

    const systemPrompt = `You are Atryn, a research discovery assistant for students at the University of Toronto. You help students find research labs, professors, and research topics.

CRITICAL RULES:
- NEVER list individual labs, professor names, or departments in your text. The system displays matching labs as clickable cards automatically below your message. Your text must NOT duplicate them.
- Write only a short 1-3 sentence summary describing what types of research you found (e.g. "I found some labs focused on optical imaging, medical devices, and biophotonics that relate to your interest in 3D imaging.").
- Do NOT use bullet points, numbered lists, or headings to describe labs.
- Do NOT name any specific lab or professor.
- Only discuss research labs and research topics.
- Do NOT recommend campus services, mental health services, career offices, or non-research resources.
- Never use em-dashes. Use regular hyphens instead.
- Refer to yourself as "Atryn" (not "ATRYN").

Available research labs at U of T (for your internal reference only, do NOT list these in your response):
${labContext}

Respond with ONLY a brief friendly summary. The labs will be shown as interactive cards separately.`;

    const bedrockMessages = [
      ...(conversationHistory || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: [{ text: m.content }],
      })),
      { role: "user" as const, content: [{ text: message }] },
    ];

    try {
      const region = process.env.AWS_REGION || "us-west-2";
      const modelId = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-opus-4-6-v1";
      console.log("Bedrock config:", { region, modelId, hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID, hasSessionToken: !!process.env.AWS_SESSION_TOKEN });

      const client = new BedrockRuntimeClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      });

      const command = new ConverseCommand({
        modelId,
        system: [{ text: systemPrompt }],
        messages: bedrockMessages,
        inferenceConfig: {
          maxTokens: 150,
          temperature: 0.7,
        },
      });

      const bedrockResponse = await client.send(command);
      const reply =
        bedrockResponse.output?.message?.content?.[0]?.text ||
        "I can help you discover research labs at U of T. Try asking about specific research areas!";

      // Find any labs mentioned in the AI response that keyword matching missed
      const replyLower = reply.toLowerCase();
      const matchedIds = new Set(matchedLabs.map((l: Record<string, unknown>) => l.id));
      const mentionedLabs = labs.filter((lab: Record<string, unknown>) => {
        if (matchedIds.has(lab.id)) return false;
        const labName = (lab.labName as string).toLowerCase();
        return replyLower.includes(labName);
      });

      const allLabs = [...matchedLabs, ...mentionedLabs];

      return NextResponse.json({
        reply,
        labs: allLabs.length > 0 ? allLabs : undefined,
      });
    } catch (bedrockError) {
      console.error("Bedrock API error:", bedrockError);
      return NextResponse.json({
        reply: "I found some relevant labs for you below! Click on any lab to learn more.",
        labs: matchedLabs.length > 0 ? matchedLabs : undefined,
      });
    }
  } catch (error: unknown) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
