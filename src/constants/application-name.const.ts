/*
 * More validation logic, or value modification could be added here if needed 
 */

// get the application name from environment vars
const APPLICATION_NAME: string | undefined = process.env.APPLICATION_NAME;

// application name is mandatory
if (!APPLICATION_NAME || /^\s+$/.test(APPLICATION_NAME)) {
	console.error(
		'APPLICATION_NAME is mandatory and needed to create the CDK Stack'
	);
	process.exit();
}

export default APPLICATION_NAME as string;
