import { Hono } from "hono";

const app = new Hono();

app.get("/todo/:id", (context) => {
  const todoId = Number(context.req.param("id"));
  return context.json({ message: "hello" });
});

export default app;
