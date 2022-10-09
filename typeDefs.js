import { gql } from "apollo-server-express";

const typeDefs = gql`
  scalar Date

  type User {
    id: ID
    firstName: String
    lastName: String
    email: String
    createdAt: Date
  }

  type Query {
    users: [User]
    user: User
    messageByUser(receiverId: ID!): [Message]
  }

  input UserInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
  }

  input signinInput {
    email: String!
    password: String!
  }

  type Token {
    token: String!
  }

  type Message {
    id: ID!
    text: String!
    senderId: ID!
    receiverId: ID!
    createdAt: Date!
  }

  input MessageInput {
    text: String!
    receiverId: ID!
  }

  type Mutation {
    signup(newUser: UserInput!): User
    signin(user: signinInput!): Token
    createMessage(messageDetail: MessageInput!): Message
  }

  type Subscription {
    messageAdded: Message
  }
`;

export default typeDefs;
