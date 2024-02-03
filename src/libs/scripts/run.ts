import _ from "lodash";
import { logger } from "../../utils/logger";
import generateEmbedding from "../../utils/generateEmbedding";
import supabase from "../../services/supabase";
import summarizeContext from "../../utils/summarizeContext";
import generateResponse from "../../utils/generateResponse";
import { ChatCompletionMessage } from "openai/resources";
import { task } from "./task";

export async function tars(
	caseResponse: ChatCompletionMessage,
	embedding: any,
	previousMessageId: any
) {
	logger("CASE: ", [{ text: caseResponse, embedding, previousMessageId }]);

	if (!caseResponse) {
		logger("caseResponse Error", []);
		throw new Error("CASE has to respond.");
	}

	try {
		const { data: tarsLogs, error: tarsLogsError } = await supabase.rpc(
			"match_tars_logs",
			{
				query_embedding: embedding,
				match_threshold: 0.78,
				match_count: 5,
			}
		);
		logger("Found similar vectors from TARS's logs: ", [
			{ tarsLogs, tarsLogsError },
		]);

		const { data: caseLogs, error: caseLogsError } = await supabase.rpc(
			"match_case_logs",
			{
				query_embedding: embedding,
				match_threshold: 0.78,
				match_count: 5,
			}
		);
		logger("Found similar vectors from CASE's logs: ", [
			{ tarsLogs, caseLogsError },
		]);

		const tarsContext = _.map(
			tarsLogs,
			(log) => `You previously said: ${log.content}`
		).join(" ");
		const caseContext = _.map(
			caseLogs,
			(log) => `Case previously said: ${log.content}`
		).join(" ");

		const context = `Relevant context for CASE's response: ${tarsContext} ${caseContext}`;
		const summarizedContext =
			tarsLogs || caseLogs ? await summarizeContext(context) : caseResponse;
		const text = await generateResponse(summarizedContext, caseResponse, true);
		const tarsEmbedding = await generateEmbedding(String(text));

		if (!text) {
			logger("text Error", []);
			throw new Error("CASE has to respond.");
		}

		const { data: newEntry, error: newEntryError } = await supabase
			.from("tars")
			.insert({
				text,
				previousMessageId,
				self: true,
				embedding: tarsEmbedding,
			});
		logger("newEntry", [{ newEntry }]);

		if (!newEntry) {
			logger("TARS: Error inserting new entry", [newEntryError]);
		}

		logger("Responding to CASE");
		const typedText = text as unknown;
		return await processCase(
			typedText as ChatCompletionMessage,
			tarsEmbedding,
			previousMessageId
		);
	} catch (error) {
		throw new Error("Internal server error");
	}
}

export async function processCase(
	tarsResponse: ChatCompletionMessage,
	embedding: any,
	previousMessageId: any
): Promise<any> {
	logger("TARS: ", [{ text: tarsResponse, embedding, previousMessageId }]);

	if (!tarsResponse) {
		logger("tarsResponse Error", []);
		throw new Error(" has to respond.");
	}

	try {
		const { data: tarsLogs } = await supabase.rpc("match_documents", {
			query_embedding: embedding,
			match_threshold: 0.78,
			match_count: 5,
		});
		logger("Found similar vectors from TARS's logs: ", [{ tarsLogs }]);

		const { data: caseLogs } = await supabase.rpc("match_documents", {
			query_embedding: embedding,
			match_threshold: 0.78,
			match_count: 5,
		});
		logger("Found similar vectors from CASE's logs: ", [{ tarsLogs }]);

		const caseContext = _.map(
			tarsLogs,
			(log) => `You previously said: ${log.text}`
		).join(" ");
		const tarsContext = _.map(
			caseLogs,
			(log) => `TARS previously said: ${log.text}`
		).join(" ");

		const context = `Relevant context for CASE's response: ${tarsContext} ${caseContext}`;
		const summarizedContext =
			tarsLogs || caseLogs ? await summarizeContext(context) : tarsResponse;
		const text = await generateResponse(summarizedContext, tarsResponse, false);
		const caseEmbedding = await generateEmbedding(String(text));

		if (!text) {
			logger("text Error", []);
			throw new Error("TARS has to respond.");
		}

		const { data: newEntry, error: newEntryError } = await supabase
			.from("case")
			.insert({
				text,
				previousMessageId,
				self: false,
				embedding: caseEmbedding,
			});
		logger("newEntry", [{ newEntry }]);

		if (!newEntry) {
			logger("CASE: Error inserting new entry", [newEntryError]);
		}

		logger("Responding to TARS");

		const typedText = text as unknown;

		return await tars(
			typedText as ChatCompletionMessage,
			caseEmbedding,
			previousMessageId
		);
	} catch (error) {
		throw new Error("Internal server error");
	}
}
