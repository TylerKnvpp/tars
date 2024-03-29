# TARS

![TARS](./public/tars.png)

## How the Script Works

The script operates in a series of steps to enable the Language Learning Model (LLM) to have long-term memory and generate responses based on the context of the conversation. Here's a high-level overview:

1. Receiving the Message: The script starts by receiving a message from the user or another AI. This message is processed and an embedding is generated for it.

2. Finding Similar Vectors: The script then uses the generated embedding to find similar vectors in the database. This is done by calling the match_tars_logs and match_case_logs functions, which return logs that have a cosine similarity above a certain threshold with the query embedding. This is how the LLM is able to recall past interactions and maintain a form of long-term memory.

```ts
const { data: tarsLogs, error: tarsLogsError } = await supabase.rpc(
	"match_tars_logs",
	{
		query_embedding: embedding,
		match_threshold: 0.78,
		match_count: 5,
	}
);
```

3. Summarizing Context: The script then summarizes the context from the similar vectors found in the previous step. This is done by joining the logs into a single string and passing it to the summarizeContext function. If no similar vectors are found, the original message is used as the context.

```ts
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
```

4. Generating Response: The summarized context is then passed to the generateResponse function, which uses OpenAI's GPT-4 model to generate a response. This response is then returned and can be used in the next message in the conversation.

```ts
export default async function generateResponse(
	summarizedContext: ChatCompletionMessage | string | null | undefined,
	caseResponse: ChatCompletionMessage,
	tars: boolean = true
) {
	...
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
```

5. Storing the Response: Finally, the generated response is stored in the database along with its embedding and the ID of the previous message. This allows the script to maintain a record of the conversation and use it in future interactions.

```ts
const { data: newEntry, error: newEntryError } = await supabase
	.from("tars")
	.insert({
		text,
		previousMessageId,
		self: true,
		embedding: tarsEmbedding,
	});
```

This process is repeated for each new message, allowing the script to maintain a continuous conversation with the user or another AI.

## Required Services

To run this script, you will need the following services:

1. Supabase: This is used as the main database for storing and retrieving data. You will need to set up a Supabase account and create a new project. The connection details for this project (URL and API key) should be added to your environment variables.

```ts
const supabase = createClient(
	String(process.env.SUPABASE_URL),
	String(process.env.SUPABASE_API_KEY)
);
```

2. OpenAI: This is used for generating responses and embeddings. You will need to set up an OpenAI account and get an API key. This key should be added to your environment variables.

```ts
const openai = new OpenAI({
	apiKey: String(process.env.OPENAI_API_KEY),
});
```

## Required Database Tables

The script requires the following tables in the Supabase database with the `pgVector` extension enabled:

1. tars: This table stores the responses generated by TARS. Each entry in this table includes the text of the response, the ID of the previous message, a boolean indicating whether the message was self-generated, and the embedding of the response.

2. case: This table is similar to the tars table but stores the responses generated by CASE.

Each of these tables should have the following columns:

- `id`: A unique identifier for each entry.
- `text`: The text of the response.
- `previousMessageId`: The ID of the previous message.
- `self`: A boolean indicating whether the message was self-generated.
- `embedding`: The embedding of the response.

Please refer to the Supabase documentation for instructions on how to create these tables.

## Getting Started

To start the script, you can use the following command:
`npm run start`

This command will start the server and TARS will be ready to assist you.

## Making Updates

The main task for TARS is defined in src/libs/scripts/task.ts. If you want to change the task or the specialties of TARS, you can update the task and specialties constants in this file.
task.ts

```ts
export const task = "...";
export const specialties = "...";
```

## Running the Application

Before running the application, make sure to install all the necessary dependencies by running:
install

```
npm install
```

## Contributing

Contributions are welcome. Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
