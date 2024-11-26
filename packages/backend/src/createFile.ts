import crypto from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { success, failure } from "./libs/response";
import { APIGatewayEvent } from "aws-lambda";
import { Media } from "./models/media";

export const handler = async (event: APIGatewayEvent) => {
  const data = JSON.parse(event.body || "{}");

  if (Object.keys(data).length === 0) {
    return failure({
      level: "GENERAL",
      message: "Empty request recieved on server!",
    });
  }

  try {
    const payload: Media = {
        fileId: crypto.randomBytes(20).toString("hex"),
        ...data,
    } as Media;

    const params = {
      TableName: process.env.FUPLOAD_TABLE_NAME || "",
      Item: marshall(payload),
    };

    let client: DynamoDBClient;

    if (process.env.LOCALSTACK_HOSTNAME) {
      const localStackConfig = {
        endpoint: `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`,
        region: "us-east-1",
      };
      client = new DynamoDBClient(localStackConfig);
    } else {
      client = new DynamoDBClient({});
    }

    await client.send(new PutItemCommand(params));
    return success([payload]);
  } catch (e) {
    console.log(e);
    return failure({
      level: "CRITICAL",
      message: e.message,
    });
  }
};
