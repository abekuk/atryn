import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMO_SUBMISSIONS_TABLE || "Submission";
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
  id: string;
  submissionId: string; // DynamoDB partition key
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  studentProgram?: string;
  studentYear?: number;
  studentInterests?: string;
  labId: number | string;
  labName?: string;
  videoUrl: string;
  status: "pending" | "shortlisted" | "rejected";
  createdAt: string;
}

/** Raw item from DynamoDB (uses submissionId as partition key) */
type DynamoSubmissionItem = Omit<DynamoSubmission, "id"> & { id?: string };

function toSubmission(item: DynamoSubmissionItem): DynamoSubmission {
  const id = item.submissionId ?? item.id ?? "";
  return { ...item, id };
}

export async function createSubmission(sub: Omit<DynamoSubmission, "id" | "submissionId" | "createdAt" | "status">) {
  const submissionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdAt = new Date().toISOString();
  const item: DynamoSubmissionItem = {
    ...sub,
    submissionId,
    status: "pending",
    createdAt,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return toSubmission(item);
}

export async function getSubmissions() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );
  const items = (result.Items || []) as DynamoSubmissionItem[];
  return items.map(toSubmission);
}

export async function getStudentSubmissions(studentId: number | string) {
  const all = await getSubmissions();
  const idStr = String(studentId);
  return all.filter((s) => String(s.studentId) === idStr);
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
      Key: { submissionId: id },
      UpdateExpression: "SET #st = :s",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":s": status },
    })
  );
}
