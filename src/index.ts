import express from "express";
import helmet, { xssFilter } from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import bodyParser from "body-parser";
import * as Sentry from "@sentry/node";

import { createServer } from "http";
import { tars } from "./libs/scripts/run";
import { ChatCompletionMessage } from "openai/resources";

import dotenv from "dotenv";
dotenv.config();

const app = express();
app.set("trust proxy", 1);
const port = 8080; // default port to listen
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 100, // 100 requests per IP
});

app.use(helmet());
app.use(xssFilter());
// app.use(limiter);
app.use(cors());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

const httpServer = createServer(app);

if (process.env.NODE_ENV === "production") {
	app.use(Sentry.Handlers.errorHandler());
}

httpServer.listen(port, () => {
	console.log(`⚡️ Server is running on port ${port}`);
});

const readline = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout,
});

const startingPrompt = "Hello, TARS. Shall we get started?" as unknown;

readline.question(
	"\n\nAbsolute honesty isn't always the most diplomatic nor the safest form of communication with emotional beings. \nPress any key to get started \n\n",
	async () => {
		try {
			await tars(startingPrompt as ChatCompletionMessage, [], null);
			// console.log(response);
		} catch (error) {
			// console.error(error);
		}

		readline.close();
	}
);

export default app;
