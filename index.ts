import { Hono } from "hono";

const app = new Hono();

app.get("/todo/:id", (context) => {
  return context.json({ message: "hello" });
});

export default app;
