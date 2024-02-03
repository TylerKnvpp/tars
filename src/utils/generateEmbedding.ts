import openai from "../services/openai";

export default async function generateEmbedding(input: string) {
	try {
		const response = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: input,
			encoding_format: "float",
		});
		console.log("Embedding generated");
		return response.data[0].embedding;
	} catch (error) {
		console.error(error);
		console.log("Error generating embedding", error);
		return [];
	}
}
