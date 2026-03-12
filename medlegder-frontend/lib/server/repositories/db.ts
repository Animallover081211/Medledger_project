import {drizzle} from "drizzle-orm/libsql";
import {createClient} from "@libsql/client";
import {loadDbEnv} from "../config/db_config";

const env = loadDbEnv();

const client = createClient({
  url: env.url,
  authToken: env.authToken,
});

export const db = drizzle(client);
