export const logger = (service: string, logs?: any[]) => {
	console.log("-----------------------");
	console.log(`Service: ${service}`);
	logs?.forEach((log) => console.log(log));
};
