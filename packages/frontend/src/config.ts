const REGION = process.env.REGION || "us-east-1";
const MAX_FILE_SIZE = 2000000;
const FILES_BUCKET =
  process.env.FILES_BUCKET || "aws-sdk-fupload-filesbucket2b30d8e0-e68947ce";
const IDENTITY_POOL_ID =
  process.env.IDENTITY_POOL_ID ||
  "us-east-1:7cd19149-3f3f-4f7a-8089-207c0fdfc818";
const LOCALSTACK_BASE = process.env.LOCALSTACK_BASE || "http://localhost:4566";
const GATEWAY_ID = process.env.GATEWAY_ID || "gowjclof5p";
const GATEWAY_URL =
  process.env.GATEWAY_URL ||
  `${LOCALSTACK_BASE}/restapis/${GATEWAY_ID}/prod/_user_request_/`;

export {
  GATEWAY_URL,
  REGION,
  MAX_FILE_SIZE,
  FILES_BUCKET,
  IDENTITY_POOL_ID,
  LOCALSTACK_BASE,
};
