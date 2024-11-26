import {
  Stack,
  StackProps,
  CfnOutput,
  aws_apigateway as apigw,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_s3 as s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { FUploadApi } from "./fupload-server-api";

export class AwsSdkJsFUploadStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "uploads", {
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
    });

    const api = new apigw.RestApi(this, "endpoint");
    const uploads = api.root.addResource("uploads");
    uploads.addMethod(
      "GET",
      new apigw.LambdaIntegration(
        new FUploadApi(this, "retrieveUploads", {
          table,
          grantActions: ["dynamodb:Scan"],
        }).handler
      )
    );
    uploads.addMethod(
      "POST",
      new apigw.LambdaIntegration(
        new FUploadApi(this, "createUpload", {
          table,
          grantActions: ["dynamodb:PutItem"],
        }).handler
      )
    );
    const upload = uploads.addResource("{id}", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });
    upload.addMethod(
      "GET",
      new apigw.LambdaIntegration(
        new FUploadApi(this, "fetchUpload", {
          table,
          grantActions: ["dynamodb:GetItem"],
        }).handler
      )
    );
    upload.addMethod(
      "DELETE",
      new apigw.LambdaIntegration(
        new FUploadApi(this, "deleteUpload", {
          table,
          grantActions: ["dynamodb:DeleteItem"],
        }).handler
      )
    );

    const filesBucket = new s3.Bucket(this, "files-bucket");
    filesBucket.addCorsRule({
      allowedOrigins: apigw.Cors.ALL_ORIGINS,
      allowedMethods: [
        s3.HttpMethods.PUT,
        s3.HttpMethods.GET,
        s3.HttpMethods.DELETE,
      ],
      allowedHeaders: ["*"],
    });

    const identityPool = new cognito.CfnIdentityPool(this, "identity-pool", {
      allowUnauthenticatedIdentities: true,
    });

    const unauthenticated = new iam.Role(this, "unauthenticated-role", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "unauthenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    // NOT recommended for production code - only give read permissions for unauthenticated resources
    filesBucket.grantRead(unauthenticated);
    filesBucket.grantPut(unauthenticated);
    filesBucket.grantDelete(unauthenticated);

    // Add policy to start Transcribe stream transcription
    unauthenticated.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["transcribe:StartStreamTranscriptionWebSocket"],
      })
    );

    // Add policy to enable Amazon Polly text-to-speech
    unauthenticated.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonPollyFullAccess")
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, "role-attachment", {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticated.roleArn,
      },
    });

    new CfnOutput(this, "FilesBucket", { value: filesBucket.bucketName });
    new CfnOutput(this, "IdentityPoolId", { value: identityPool.ref });
    new CfnOutput(this, "GatewayUrl", { value: api.url });
    new CfnOutput(this, "Region", { value: this.region });
  }
}
