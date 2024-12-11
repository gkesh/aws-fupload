const REGION = process.env.REGION || "us-east-1";
const MAX_FILE_SIZE = 2000000;
const FILES_BUCKET =
  process.env.FILES_BUCKET || "aws-sdk-fupload-filesbucket2b30d8e0-22fb5201";
const IDENTITY_POOL_ID =
  process.env.IDENTITY_POOL_ID ||
  "us-east-1:dbfadaba-dbdb-416c-a0d1-b3cb12c51177";
const LOCALSTACK_BASE = process.env.LOCALSTACK_BASE || "http://localhost:4566";
const GATEWAY_ID = process.env.GATEWAY_ID || "ixsnto2ftg";
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
