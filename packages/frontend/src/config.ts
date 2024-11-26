const GATEWAY_URL = process.env.GATEWAY_URL || "https://dz3dg241eq.execute-api.localhost.localstack.cloud:4566/prod/";
const REGION = process.env.REGION || "us-east-1";
const MAX_FILE_SIZE = 2000000;
const FILES_BUCKET = process.env.FILES_BUCKET || "";
const IDENTITY_POOL_ID = process.env.IDENTITY_POOL_ID || "";

export {
  GATEWAY_URL,
  REGION,
  MAX_FILE_SIZE,
  FILES_BUCKET,
  IDENTITY_POOL_ID
}
