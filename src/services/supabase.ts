import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(
	String(process.env.SUPABASE_URL),
	String(process.env.SUPABASE_API_KEY)
);
export default supabase;
