import { DynamoDBClient, DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { success, failure } from "./libs/response";
import { APIGatewayEvent } from "aws-lambda";
import { Media } from "./models/media";

export const handler = async (event: APIGatewayEvent) => {
  const params = {
    TableName: process.env.NOTES_TABLE_NAME || "",
    Key: marshall({ fileId: event.pathParameters?.id }),
  };

  try {
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

    const result = await client.send(new GetItemCommand(params));
    if (!result.Item) {
      return failure({ level: "GENERAL", message: "Item not found." });
    }

    const media = unmarshall(result.Item) as Media;

    await client.send(new DeleteItemCommand(params));
    return success([media]);
  } catch (e) {
    console.log(e);
    return failure({
      level: "CRITICAL",
      message: e.message,
    });
  }
};
