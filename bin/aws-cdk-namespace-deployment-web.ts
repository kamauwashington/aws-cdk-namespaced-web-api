#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkNamespaceDeploymentWebStack } from '../lib/aws-cdk-namespace-deployment-web-stack';
import APPLICATION_NAME from '../src/constants/application-name.const';
import NAMESPACE from '../src/constants/namespace.const';

const app = new cdk.App();
new AwsCdkNamespaceDeploymentWebStack(app, `${NAMESPACE}`, {});
cdk.Tags.of(app).add('NAMESPACE', NAMESPACE);
cdk.Tags.of(app).add('APPLICATION_NAME', APPLICATION_NAME);