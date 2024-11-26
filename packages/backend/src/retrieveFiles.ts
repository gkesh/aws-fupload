import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { success, failure } from "./libs/response";
import { Media } from "./models/media";

export const handler = async () => {
  const params = {
    TableName: process.env.FUPLOAD_TABLE_NAME || "",
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

    const result = await client.send(new ScanCommand(params));
    // Return the matching list of items in response body
    return success(result.Items.map((Item) => unmarshall(Item) as Media));
  } catch (e) {
    console.log(e);
    return failure({
      level: "CRITICAL",
      message: e.message,
    });
  }
};