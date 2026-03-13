import { Resource } from "./types";
import seedData from "../../data/seed-resources.json";

// In production, this reads from DynamoDB
// In local/mock mode, this reads from the seed JSON file

const USE_DYNAMO = process.env.USE_DYNAMO === "true";

let cachedResources: Resource[] | null = null;

export async function getAllResources(): Promise<Resource[]> {
  if (cachedResources) return cachedResources;

  if (USE_DYNAMO) {
    const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
    const { DynamoDBDocumentClient, ScanCommand } = await import(
      "@aws-sdk/lib-dynamodb"
    );

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-west-2",
    });
    const docClient = DynamoDBDocumentClient.from(client);

    const result = await docClient.send(
      new ScanCommand({ TableName: process.env.DYNAMO_TABLE || "CampusResources" })
    );

    cachedResources = (result.Items || []) as Resource[];
  } else {
    cachedResources = seedData as Resource[];
  }

  return cachedResources;
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  const resources = await getAllResources();
  return resources.find((r) => r.id === id);
}
