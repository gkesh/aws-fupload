import { Failure } from "../models/failure";
import { Media } from "../models/media";

export const success = (body: Media[]) => {
  return buildResponse(200, body);
};

export const failure = (body: Failure) => {
  return buildResponse(500, body);
};

type Body = never | Failure | Media[];

const buildResponse = <T extends Body>(statusCode: number, body: T) => ({
  statusCode: statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify(body),
});
