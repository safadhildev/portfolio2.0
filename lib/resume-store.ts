import { Redis } from "@upstash/redis";
import type { CounterStore } from "./resume-counter.ts";

/** Adapts the Upstash REST client to the small CounterStore surface. */
export function createUpstashStore(creds: { url: string; token: string }): CounterStore {
  const redis = new Redis({ url: creds.url, token: creds.token });
  return {
    set: async (key, value, options) => {
      const result = await redis.set(key, value, options);
      return result === "OK" ? "OK" : null;
    },
    incr: (key) => redis.incr(key),
    hincrby: (key, field, increment) => redis.hincrby(key, field, increment),
  };
}
