 import * as path from 'path';

import { Construct } from 'constructs';
import DOMAIN_NAME from '../src/constants/domain-name.const';
import NAMESPACE from '../src/constants/namespace.const';


// CDK resources
import * as CDK from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import {
	OriginAccessIdentity,
	CloudFrontWebDistribution,
	ViewerCertificate,
  CloudFrontAllowedMethods
} from 'aws-cdk-lib/aws-cloudfront';
import { HostedZone, IHostedZone, AaaaRecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';





export class AwsCdkNamespaceDeploymentWebStack extends CDK.Stack {
  constructor(scope: Construct, id: string, props?: CDK.StackProps) {
		super(scope, id, {
			/*
			 * Not a fan of this, AWS CDK should have this built into a cascading find.
			 * In order perform some lookups, it needs the env set at the stack level not the process level
			 * in this case noteably HostedZones.fromLookup()
			 */
			env: {
				account: process.env.CDK_DEFAULT_ACCOUNT,
				region: process.env.CDK_DEFAULT_REGION,
			},
		});

		// lets get ex "<random namespace>.example.com";
		const domainWithNamespace: string = `${NAMESPACE}.${DOMAIN_NAME}`;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ S3 Bucket ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

		// create the S3 bucket for our web assets
		const websiteBucket: Bucket = new Bucket(this, `${NAMESPACE} S3 Bucket`, {
			websiteIndexDocument: 'index.html',
			bucketName: domainWithNamespace.toLowerCase(),
			removalPolicy: CDK.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		/*
		 * if this is an SPA, the code should be compiled prior to cdk deploy to build the assets
		 * and place them in the appropriate FlowLogResourceType, in this case we are using ./dist
		 * as it is common.
		 */
		const bucketDeployment: BucketDeployment = new BucketDeployment(
			this,
			`${NAMESPACE} S3 Bucket Deployment`,
			{
				sources: [Source.asset('./dist')],
				destinationBucket: websiteBucket,
			}
		);

		// we need an Origin Access Identity (OAI) for CloudFront to read from our private bucket
		const originAccessIdentity: OriginAccessIdentity = new OriginAccessIdentity(
			this,
			`${NAMESPACE} CloudFront OAI`
		);
		// grant read rights to the S3 Bucket for the OAI
		websiteBucket.grantRead(originAccessIdentity);

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Lambda ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

		const defaultAPIHandler: NodejsFunction = new NodejsFunction(
			this,
			`${domainWithNamespace}/api default handler`,
			{
				runtime: lambda.Runtime.NODEJS_16_X,
				handler: 'handler',
				entry: path.join(__dirname, '../src/lambda/default.ts'),
				memorySize: 128,
				functionName: `${NAMESPACE}-Default-Handler`,
			}
		);

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DNS + Certificate ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

		// lets find our existing hosted zone. This shouldn't change often and should already be configured in AWS
		const hostedZone: IHostedZone = HostedZone.fromLookup(
			this,
			`${NAMESPACE} Hosted Zone`,
			{
				domainName: DOMAIN_NAME, // should be able to be pulled from DOMAIN_NAME environment variable
			}
		);

		/*
		 * We need to use the wildcard certificate for this subdomain (as we want to test via https).
		 * This lookup can be performed via ARN, however by DNS seems cleaner as we already have the
		 * full domain which would resolve via DNS to use the wildcard certificate
		 */
		const wildCardCertificateFromDNS: DnsValidatedCertificate =
			new DnsValidatedCertificate(this, `${NAMESPACE} wildcard certificate`, {
				domainName: domainWithNamespace,
				hostedZone: hostedZone,
			});

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ APIGW ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

		const api = new RestApi(this, `${NAMESPACE} Rest Api`, {
			description: `API for ${NAMESPACE} environment`,
			deployOptions: {
				stageName: 'prod',
			},
			// domainName: {
			// 	domainName: NAMESPACE,
			// 	certificate : wildCardCertificateFromDNS
      // },
      restApiName : NAMESPACE
		});

		// since the root "/" will be used by static web, lets use "/api" for our integration starting point
    const apiRoute = api.root.addResource('api');
    apiRoute.addMethod('GET', new LambdaIntegration(defaultAPIHandler, {
      proxy : true
    }));

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CloudFront ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

		/*
		 * Create the CloudFront Distribution, setting the S3 Bucket as the origin, and the alias to the domain
		 * with the wildcard certificate.
		 */
		const cloudFrontDistribution: CloudFrontWebDistribution =
			new CloudFrontWebDistribution(
				this,
				`${NAMESPACE} CloudFront distribution for S3 bucket and APIGW`,
				{
					originConfigs: [
						{
							customOriginSource: {
								domainName: `${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
								originPath: `/${api.deploymentStage.stageName}`,
							},
							behaviors: [
								{
									allowedMethods: CloudFrontAllowedMethods.ALL,
									pathPattern: '/api/*',
								},
								{
									allowedMethods: CloudFrontAllowedMethods.ALL,
									pathPattern: '/api',
								},
							],
						},
						{
							s3OriginSource: {
								originAccessIdentity: originAccessIdentity,
								s3BucketSource: websiteBucket,
							},
							behaviors: [{ isDefaultBehavior: true }],
						},
					],
					viewerCertificate: ViewerCertificate.fromAcmCertificate(
						wildCardCertificateFromDNS,
						{
							aliases: [domainWithNamespace],
						}
					),
				}
			);

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Route53 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

		// create a Route53 record that target the Cloud Formation Distribution
		new AaaaRecord(this, `${NAMESPACE} Alias Route53 configuration`, {
			zone: hostedZone,
			target: RecordTarget.fromAlias(
				new CloudFrontTarget(cloudFrontDistribution)
			),
			recordName: domainWithNamespace,
		});
	}
}
