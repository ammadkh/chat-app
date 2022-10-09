import pc from "@prisma/client";
import { AuthenticationError, ForbiddenError } from "apollo-server-express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();

const prisma = new pc.PrismaClient();
export const MESSAGE_ADDED = "MESSAGE_ADDED";

const resolvers = {
  Query: {
    users: async (_, args, { id }) => {
      const userId = id;
      console.log("users");
      if (!id) throw new AuthenticationError("you must be logged in");
      const users = await prisma.user.findMany({
        where: { id: { not: +userId } },
      });
      return users;
    },
    messageByUser: async (parent, { receiverId }, { id }) => {
      const userId = +id;
      if (!id) throw new AuthenticationError("you must be logged in");
      const msgs = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: +receiverId },
            { senderId: +receiverId, receiverId: userId },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return msgs;
    },
  },
  Mutation: {
    signup: async (_, { newUser }, context) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: newUser.email },
      });
      if (existingUser) {
        throw new AuthenticationError("user already exists");
      }
      const hashedPassword = await bcrypt.hash(newUser.password, 12);
      const newuser = await prisma.user.create({
        data: {
          ...newUser,
          password: hashedPassword,
        },
      });
      return newUser;
    },

    signin: async (parent, { user }, context) => {
      const isUserExist = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!isUserExist) throw new ForbiddenError("user not found");
      const isPasswordValid = await bcrypt.compare(
        user.password,
        isUserExist.password
      );
      if (!isPasswordValid) throw new ForbiddenError("password is incorrect");
      const token = jwt.sign(isUserExist.id, process.env.JWT_SERET_KEY);
      return { token };
    },

    createMessage: async (_, { messageDetail }, { id }) => {
      console.log(messageDetail, "message detail");
      const userId = +id;
      if (!userId)
        throw new AuthenticationError(
          "user must be logged In to send a message"
        );
      const message = await prisma.message.create({
        data: {
          text: messageDetail.text,
          receiverId: +messageDetail.receiverId,
          senderId: userId,
        },
      });
      pubsub.publish(MESSAGE_ADDED, {
        messageAdded: message,
      });
      return message;
    },
  },

  Subscription: {
    messageAdded: {
      // More on pubsub below
      subscribe: () => pubsub.asyncIterator([MESSAGE_ADDED]),
    },
  },
};

export default resolvers;
