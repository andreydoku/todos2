import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2'
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import type { Construct } from 'constructs'

interface Todos2StackProps extends cdk.StackProps {
  environment: 'dev' | 'prod'
}

export class Todos2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Todos2StackProps) {
    super(scope, id, props)

    const { environment } = props

    // DynamoDB table
    const table = new dynamodb.Table(this, 'TodosTable', {
      tableName: `Todos2-${environment}-table`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Shared Lambda config
    const handlerDir = path.join(__dirname, '../../backend/src/handlers')
    const lambdaEnv = { TABLE_NAME: table.tableName }
    const lambdaRuntime = lambda.Runtime.NODEJS_22_X

    const makeHandler = (id: string, resourceName: string, entry: string) =>
      new lambdaNode.NodejsFunction(this, id, {
        functionName: `Todos2-${environment}-${resourceName}`,
        entry: path.join(handlerDir, entry),
        runtime: lambdaRuntime,
        environment: lambdaEnv,
        bundling: { minify: true, sourceMap: false },
      })

    const getTodosFn = makeHandler('GetTodos', 'get-todos', 'getTodos.ts')
    const createTodoFn = makeHandler('CreateTodo', 'create-todo', 'createTodo.ts')
    const updateTodoFn = makeHandler('UpdateTodo', 'update-todo', 'updateTodo.ts')
    const deleteTodoFn = makeHandler('DeleteTodo', 'delete-todo', 'deleteTodo.ts')

    table.grantReadData(getTodosFn)
    table.grantWriteData(createTodoFn)
    table.grantReadWriteData(updateTodoFn)
    table.grantWriteData(deleteTodoFn)

    // HTTP API Gateway
    const httpApi = new apigatewayv2.HttpApi(this, 'TodosApi', {
      apiName: `Todos2-${environment}-api`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    const int = (fn: lambda.IFunction) =>
      new apigatewayv2Integrations.HttpLambdaIntegration(`${fn.node.id}Int`, fn)

    httpApi.addRoutes({ path: '/todos', methods: [apigatewayv2.HttpMethod.GET], integration: int(getTodosFn) })
    httpApi.addRoutes({ path: '/todos', methods: [apigatewayv2.HttpMethod.POST], integration: int(createTodoFn) })
    httpApi.addRoutes({ path: '/todos/{id}', methods: [apigatewayv2.HttpMethod.PUT], integration: int(updateTodoFn) })
    httpApi.addRoutes({ path: '/todos/{id}', methods: [apigatewayv2.HttpMethod.DELETE], integration: int(deleteTodoFn) })

    // S3 bucket for frontend
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `todos2-${environment}-site`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    })

    // Deploy frontend build to S3
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    })

    cdk.Tags.of(this).add('Project', 'Todos2')
    cdk.Tags.of(this).add('Environment', environment)

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway URL — use as VITE_API_URL when building frontend',
    })
    new cdk.CfnOutput(this, 'SiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL for the app',
    })
  }
}
