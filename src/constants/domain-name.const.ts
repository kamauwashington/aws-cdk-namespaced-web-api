/*
 * More validation logic, or value modification could be added here if needed
 */

// get the domain from environment vars
const DOMAIN_NAME: string | undefined = process.env.DOMAIN_NAME;

// application name is mandatory
if (!DOMAIN_NAME || /^\s+$/.test(DOMAIN_NAME)) {
	console.error('DOMAIN is mandatory and needed to create the CDK Stack');
	process.exit();
}

export default DOMAIN_NAME as string;
