#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkNamespaceDeploymentWebStack } from '../lib/aws-cdk-namespace-deployment-web-stack';
import { APPLICATION_NAME, NAMESPACE } from '../src/constants/common.constants';
const app = new cdk.App();
new AwsCdkNamespaceDeploymentWebStack(app, `${NAMESPACE}`, {});
cdk.Tags.of(app).add('NAMESPACE', NAMESPACE as string);
cdk.Tags.of(app).add('APPLICATION_NAME', APPLICATION_NAME as string);