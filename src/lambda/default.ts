import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';

export const handler : APIGatewayProxyHandler = async function (event: APIGatewayProxyEvent) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Message Received!' }),
  };
};
