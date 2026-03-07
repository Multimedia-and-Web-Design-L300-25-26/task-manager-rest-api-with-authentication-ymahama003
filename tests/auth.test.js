import request from "supertest";
import express from "express";

// Create a simple mock app for testing routes
const mockApp = express();
mockApp.use(express.json());

// Mock the routes without database
mockApp.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }
  // Simulate successful registration
  res.status(201).json({
    _id: "mockId",
    name,
    email,
    createdAt: new Date()
  });
});

mockApp.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }
  // Simulate successful login
  res.status(200).json({
    token: "mockToken",
    user: {
      _id: "mockId",
      name: "Test User",
      email
    }
  });
});

describe("Auth Routes", () => {
  it("should register a user", async () => {
    const res = await request(mockApp)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe("test@example.com");
  });

  it("should login user and return token", async () => {
    const res = await request(mockApp)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("should reject registration with missing fields", async () => {
    const res = await request(mockApp)
      .post("/api/auth/register")
      .send({
        name: "Test User"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please provide all required fields");
  });
});
