import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMO_LABS_TABLE || "Labs_New2";
const REGION = process.env.AWS_REGION || "us-west-2";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export interface DynamoLab {
  id: string;
  name: string;
  department: string;
  category: string;
  research_area: string;
  subarea: string;
  description: string;
  keywords: string[];
  researchers: string[];
  source: string;
}

/** Map DynamoDB item → shape the frontend already expects */
function toFrontendLab(item: DynamoLab, index: number) {
  return {
    id: index + 1,
    labName: item.name,
    professorId: null,
    professorName: item.researchers?.length ? item.researchers.join(", ") : null,
    professorEmail: null,
    topics: (item.keywords ?? []).join(", "),
    description: item.description ?? "",
    department: item.department ?? "",
    dynamoId: item.id, // keep the original DynamoDB id for lookups
  };
}

let cachedLabs: ReturnType<typeof toFrontendLab>[] | null = null;

export async function getAllLabs() {
  if (cachedLabs) return cachedLabs;

  const items: DynamoLab[] = [];
  let lastKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      })
    );
    items.push(...((result.Items ?? []) as DynamoLab[]));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  cachedLabs = items.map((item, i) => toFrontendLab(item, i));
  return cachedLabs;
}

export async function getLabById(id: number) {
  const labs = await getAllLabs();
  return labs.find((l) => l.id === id) ?? null;
}
