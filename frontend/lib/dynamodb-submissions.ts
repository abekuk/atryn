import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "submission";
const REGION = process.env.AWS_REGION || "us-west-2";

const client = new DynamoDBClient({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    : undefined,
});
const docClient = DynamoDBDocumentClient.from(client);

export interface DynamoSubmission {
  id: string; // The DynamoDB partition key (uuid)
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  studentProgram?: string;
  studentYear?: number;
  studentInterests?: string;
  labId: number;
  labName?: string;
  videoUrl: string;
  status: "pending" | "shortlisted" | "rejected";
  createdAt: string;
}

export async function createSubmission(sub: Omit<DynamoSubmission, "id" | "createdAt" | "status">) {
  const item: DynamoSubmission = {
    ...sub,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
}

export async function getSubmissions() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );
  return (result.Items || []) as DynamoSubmission[];
}

export async function getStudentSubmissions(studentId: number) {
  const all = await getSubmissions();
  return all.filter((s) => s.studentId === studentId);
}

export async function getProfessorSubmissions(professorLabNameMatches: string) {
  // Normally we would use professorId, but since auth is stateless 
  // and labs are fetched from Dynamo, we'll just return all submissions to labs
  // that have matching names, or for simplicity, just return them all and let 
  // the frontend filter, or we filter here if lab details are attached.
  // For MVP, return all.
  const all = await getSubmissions();
  return all; 
}

export async function updateSubmissionStatus(id: string, status: "shortlisted" | "rejected" | "pending") {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET #st = :s",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":s": status },
    })
  );
}
