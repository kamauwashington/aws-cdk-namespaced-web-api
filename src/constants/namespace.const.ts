/*
 * More validation logic, or value modification could be added here if needed
 */

// get the namespace from environment vars
const NAMESPACE: string | undefined = process.env.NAMESPACE;

// namespace is mandatory
if (!NAMESPACE || /^\s+$/.test(NAMESPACE)) {
	console.error('NAMESPACE is mandatory and needed to create the CDK Stack');
	process.exit();
}

export default NAMESPACE as string;
