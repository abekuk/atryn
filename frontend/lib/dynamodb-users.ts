import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = process.env.DYNAMO_USERS_TABLE || "Users";
const REGION = process.env.AWS_REGION || "us-west-2";

const client = new DynamoDBClient({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }
      : undefined,
});
const docClient = DynamoDBDocumentClient.from(client);

export interface DynamoUser {
  userId: string;
  email: string;
  role: "student" | "professor";
  name: string;
  password: string;
  createdAt: string;
  program?: string;
  year?: number;
  interests?: string;
  department?: string;
  labName?: string;
}

export async function getUserByEmail(email: string): Promise<DynamoUser | null> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    })
  );
  const item = result.Items?.[0] as DynamoUser | undefined;
  return item ?? null;
}

export async function getUserById(userId: string): Promise<DynamoUser | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId },
    })
  );
  const item = result.Item as DynamoUser | undefined;
  return item ?? null;
}

export async function createUser(data: {
  email: string;
  role: "student" | "professor";
  name: string;
  password: string;
  program?: string;
  year?: number;
  interests?: string;
  department?: string;
  labName?: string;
}): Promise<DynamoUser> {
  const userId = uuidv4();
  const createdAt = new Date().toISOString();
  const item: DynamoUser = {
    userId,
    email: data.email,
    role: data.role,
    name: data.name,
    password: data.password,
    createdAt,
    ...(data.program !== undefined && { program: data.program }),
    ...(data.year !== undefined && { year: data.year }),
    ...(data.interests !== undefined && { interests: data.interests }),
    ...(data.department !== undefined && { department: data.department }),
    ...(data.labName !== undefined && { labName: data.labName }),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
}
