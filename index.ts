import { Hono } from "hono";
import { tasks } from "./assets/tasks.json";

const app = new Hono();

app.get("/todo/:id", (context) => {
  const todoId = Number(context.req.param("id"));
  const task = tasks[todoId] || {};
  return context.json(task);
});

export default app;
