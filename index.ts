import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import type { Context, Env } from "hono";
import { Hono } from "hono";
import { env } from "hono/adapter";
import type { BlankInput } from "hono/types";
import { tasks } from "./assets/tasks.json";

declare module "hono" {
  interface ContextVariableMap {
    ratelimit: Ratelimit;
  }
}

const app = new Hono();

const cache = new Map();

class RedisRateLimiter {
  static instance: Ratelimit;

  static getInstance(context: Context<Env, "/todo/:id", BlankInput>) {
    if (!this.instance) {
      const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = env<{
        UPSTASH_REDIS_REST_URL: string;
        UPSTASH_REDIS_REST_TOKEN: string;
      }>(context);

      const redisClient = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });

      const reteLimit = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(10, "10 s"),
        ephemeralCache: cache,
      });

      this.instance = reteLimit;
      return this.instance;
    } else {
      return this.instance;
    }
  }
}

app.use(async (context, next) => {
  context.set("ratelimit", RedisRateLimiter.getInstance(context));
  await next();
});

app.get("/todo/:id", async (context) => {
  const ratelimit = context.get("ratelimit");
  const ipAddr = context.req.raw.headers.get("cf-connecting-ip");

  const { success } = await ratelimit.limit(ipAddr ?? "anonymous");

  if (success) {
    const todoId = Number(context.req.param("id"));
    const task = tasks[todoId] || {};
    return context.json(task);
  } else {
    return context.json({
      message: "Rate limit exceeded",
      status: 429,
    });
  }
});

export default app;
