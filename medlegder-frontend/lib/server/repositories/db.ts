import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {loadDbEnv} from "../config/db_config";

const env = loadDbEnv();

const client = postgres(env.url);

export const db = drizzle(client);
