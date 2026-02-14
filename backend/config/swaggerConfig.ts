import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Business Nexus API",
      version: "1.0.0",
      description: "API documentation for the Business Nexus platform",
      contact: {
        name: "Support",
        url: "http://localhost:5173/help",
      },
    },
    servers: [
      {
        url: "http://localhost:3001/api",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            type: { type: "string", enum: ["deposit", "withdraw", "transfer"] },
            amount: { type: "number" },
            status: {
              type: "string",
              enum: ["pending", "completed", "failed"],
            },
            description: { type: "string" },
            recipientId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./backend/routes/*.ts"], // Path to the API docs (it scans JSDoc comments)
};

export const specs = swaggerJsdoc(options);
