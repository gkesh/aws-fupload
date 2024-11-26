import { S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { IDENTITY_POOL_ID, LOCALSTACK_BASE, REGION } from "../config";

const s3Client = new S3Client({
  region: REGION,
  endpoint: LOCALSTACK_BASE,
  forcePathStyle: true,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({
      region: REGION,
      endpoint: LOCALSTACK_BASE,
    }),
    identityPoolId: IDENTITY_POOL_ID,
  }),
});

export { s3Client };
