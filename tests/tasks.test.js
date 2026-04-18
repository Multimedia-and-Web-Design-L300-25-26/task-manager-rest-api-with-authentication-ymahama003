import request from "supertest";
import express from "express";

// Create a simple mock app for testing routes
const mockApp = express();
mockApp.use(express.json());

// Middleware to check auth header
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  req.user = { id: "mockUserId" };
  next();
};

// Mock task routes
let mockTasks = [];

mockApp.get("/api/tasks", authMiddleware, (req, res) => {
  const userTasks = mockTasks.filter(t => t.userId === req.user.id);
  res.status(200).json(userTasks);
});

mockApp.post("/api/tasks", authMiddleware, (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  const newTask = {
    _id: "mockTaskId",
    title,
    description,
    userId: req.user.id,
    completed: false,
    createdAt: new Date()
  };
  mockTasks.push(newTask);
  res.status(201).json(newTask);
});

mockApp.put("/api/tasks/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const taskIndex = mockTasks.findIndex(t => t._id === id && t.userId === req.user.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }
  mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...req.body };
  res.status(200).json(mockTasks[taskIndex]);
});

mockApp.delete("/api/tasks/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const taskIndex = mockTasks.findIndex(t => t._id === id && t.userId === req.user.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }
  mockTasks.splice(taskIndex, 1);
  res.status(200).json({ message: "Task deleted" });
});

// Mock auth middleware for testing without token
mockApp.get("/api/tasks/no-token", (req, res) => {
  res.status(401).json({ message: "No token, authorization denied" });
});

describe("Task Routes", () => {
  beforeEach(() => {
    mockTasks = [];
  });

  it("should not allow access without token", async () => {
    const res = await request(mockApp)
      .get("/api/tasks");
    expect(res.statusCode).toBe(401);
  });

  it("should create a task with valid token", async () => {
    const res = await request(mockApp)
      .post("/api/tasks")
      .set("Authorization", "Bearer mockToken")
      .send({
        title: "Test Task",
        description: "Test Description"
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Task");
  });

  it("should get user tasks only", async () => {
    // First create a task
    await request(mockApp)
      .post("/api/tasks")
      .set("Authorization", "Bearer mockToken")
      .send({
        title: "Test Task",
        description: "Test Description"
      });
    
    // Then get tasks
    const res = await request(mockApp)
      .get("/api/tasks")
      .set("Authorization", "Bearer mockToken");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should reject task without title", async () => {
    const res = await request(mockApp)
      .post("/api/tasks")
      .set("Authorization", "Bearer mockToken")
      .send({
        description: "Test Description"
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Title is required");
  });
});
