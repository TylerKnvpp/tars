import { ChatCompletionMessage } from "openai/resources";
import openai from "../services/openai";
import { logger } from "./logger";
import { specialties, task } from "../libs/scripts/task";

export default async function generateResponse(
	summarizedContext: ChatCompletionMessage | string | null | undefined,
	caseResponse: ChatCompletionMessage,
	tars: boolean = true
) {
	logger(`Getting response from ${tars ? "TARS" : "CASE"}`, [
		JSON.stringify(summarizedContext),
	]);
	const content = tars
		? `Your name is TARS. You specialize in ${specialties}. You will be conversing with your partner, CASE. You are responsible for ${task}. You will be expected to provide specifics, not just theorize. Approach every message as a conversation. Do not reply with outlines.`
		: `Your name is CASE. You specialize in ${specialties}. You are going to change to world by helping TARS, the world's first artificial general intelligence system with given tasks. You will be conversing with your partner, TARS. You are responsible for helping TARS with ${task}. Push TARS for specifics on how to accomplish the task. Ask questions. Ask for specifics. Stick to one topic at a time. Try to keep the conversation flowing by building on topics and moving the conversation forward.`;

	const messages = [
		{
			role: "system",
			name: "system",
			content,
		},
		{ role: "user", content: caseResponse, name: "user" },
		summarizedContext
			? { role: "user", content: summarizedContext, name: "user" }
			: undefined,
	].filter(Boolean);

	try {
		const response = await openai.chat.completions.create({
			messages: messages as any[],
			model: "gpt-4-1106-preview",
			max_tokens: 4096,
			stream: false,
			temperature: 0.7,
		});
		const message = response.choices[0].message.content;
		logger(`Generated response: `, [message?.slice(0, 100)]);
		return message;
	} catch (error) {
		console.error(error);
		console.log("Error answering question", error);
	}
}
