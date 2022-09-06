# Namespace based deployment with AWS CDK, Static Website, APIGW

> This repository is purely for reference and is illustrative in it is purpose.

This project illustrates using the AWS CDK v2 to provide multiple isolated stacks / environments for a static set of resources with an API in one account. While this deployment and or development style is uncommon, and AWS recommends that each developer have a sandbox as an answer to this deployment style, there are cases where a developer may want to spin up the entire or partial environment in parallel to another developer's instance within one AWS account. This could be the established deployment style for a team using Kubernetes for example, and they wish to extend that deployment style to AWS resources.

An example of this is if a front-end team wants to expose multiple branches of one application in parallel to a set of users for review against other development resources not in the CDK stack.

### Traditional Deployment Style
* sandbox.example.com
* dev.example.com
* qa.example.com
* www.example.com

### Namespace based Deployment Style
* sandbox.example.com
* dev.example.com
    * kettle-camp.example.com
    * wreck-lock.example.com
    * cabinet-yoyo.example.com
    * gullible-squirrel.example.com
* qa.example.com
* www.example.com
## Prerequisites

Before continuing, ensure you have met the following requirements:

* Global AWS CDK CLI 2.8.0 or higher (or use npx)
* An AWS profile configured in **~/.aws/config** and **~/.aws/credentials**
    * there are instructions to set up an Access Key Credential Type [here](https://cdkworkshop.com/15-prerequisites/200-account.html).
* **IMPORTANT** A registered domain name or subdomain name that points to AWS domain servers in an NS record
* **IMPORTANT** A wildcard certificate for the registered domain name or subdomain name
    * this is is easy to request via AWS ACM - **make sure that the certificate is issued in us-east-1**

## Installation

* clone this repository into a directory of your choosing
* run **npm install** in that directory 

## Deployment

This Stack requires three environment variables
 * APPLICATION_NAME
 * NAMESPACE
 * DOMAIN_NAME

These can be passed in from the command line, set for the current user or machine, provided during the CICD process or using a **.env** file (for local only). The **cdk.json** file has been changed to support **dotenv** using the _-r_ nodejs option.

> "app": "npx ts-node **-r dotenv/config** --prefer-ts-exts bin/aws-cdk-namespace-deployment.ts"

This project does not use the standard AWS Environment inline code solution seen often and opts for AWS profiles instead.

* run **cdk deploy --profile \<your profile name\>** for defined profiles in the **~/.aws** files
* run **cdk deploy** if you have defined a default profile, or have AWS environment variables set 
* **npx aws-cdk** can be used as well

## Verifying Deployment

Assuming everything runs smoothly during stack deployment, it is fairly easy to verify that the solution is deployed properly and sends messages from SNS to S3. 

* Use the AWS Tag Editor in the AWS Console, search for all resources with the tag "NAMESPACE" with \<NAMESPACE\>-\<APPLICATION_NAME\>
* Using a web browser navigate to \<NAMESPACE\>.\<DOMAIN_NAME>
    * root should be a common licensed static website
    * /api should return JSON displaying {"message":"Message Received!"}


## Notes

* This CDK representation is primarily in one file for brevity, it can be organized into smaller files by using CDK Constructs and or Child Stacks
* This repository is heavily commented to provide context as to what and why, if in VS Code feel free to collapse all comments if they are obtrusive
    * On Mac -> Press <kbd>&#8984;</kbd> + <kbd>K</kbd> then <kbd>&#8984;</kbd> + <kbd>/</kbd> 
    * On Windows & Linux -> Press <kbd>Ctrl</kbd> + <kbd>K</kbd> then <kbd>Ctrl</kbd> + <kbd>/</kbd> 