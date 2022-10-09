import { ApolloServer } from "apollo-server-express";
import typeDefs from "./typeDefs.js";
import resolvers from "./resolvers.js";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import express from "express";

const port = process.env.PORT || 4000;

const app = express();
const httpServer = createServer(app);

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    console.log(req.headers, "reques");
    const { authorization } = req.headers;
    console.log(authorization, "autherization", process.env.JWT_SERET_KEY);
    if (!!authorization) {
      try {
        const id = jwt.verify(authorization, process.env.JWT_SERET_KEY);
        console.log(id, "iss");
        return { id };
      } catch (error) {
        console.log(error, "error");
      }
    }
  },
  csrfPrevention: true,
  cache: "bounded",
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if your ApolloServer serves at
  // a different path.
  path: "/graphql",
});

// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);

await server.start();
server.applyMiddleware({ app });

const PORT = port;
// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(
    `Server is now running on http://localhost:${PORT}${server.graphqlPath}`
  );
});
