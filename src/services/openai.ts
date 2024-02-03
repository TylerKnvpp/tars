import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({
	apiKey: String(process.env.OPENAI_API_KEY),
});
export default openai;
