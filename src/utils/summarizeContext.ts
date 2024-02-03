import openai from "../services/openai";
import { logger } from "./logger";

export default async function summarizeContext(input: string) {
	logger("Summarizing context: ", [input.slice(0, 100)]);
	const messages = [
		{
			role: "system",
			name: "system",
			content:
				"Assume the role of a summarizer. You are helping develop a plan to create Artificial General Intelligence. You will be given context from previous conversations. You will be expected to summarize the context and include the most important aspects of the context.",
		},
		{ role: "user", content: input, name: "user" },
	];

	try {
		const response = await openai.chat.completions.create({
			messages: messages as any,
			model: "gpt-4-1106-preview",
			max_tokens: 4096,
			stream: false,
			temperature: 0.7,
		});

		const summarizedContext = response.choices[0].message.content;
		logger("Summarized context: ", [summarizedContext]);

		return summarizedContext;
	} catch (error) {
		console.error(error);
		console.log("Error answering question", error);
	}
}
