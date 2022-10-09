import { ApolloServer } from "apollo-server";
import typeDefs from "./typeDefs.js";
import resolvers from "./resolvers.js";
import jwt from "jsonwebtoken";

const server = new ApolloServer({
  typeDefs,
  resolvers,
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
});
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
