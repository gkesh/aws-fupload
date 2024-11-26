import { App } from "aws-cdk-lib";
import { AwsSdkJsFUploadStack } from "./aws-sdk-js-fupload-stack";

const app = new App();
new AwsSdkJsFUploadStack(app, "aws-sdk-fupload");
