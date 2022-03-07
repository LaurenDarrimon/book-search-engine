const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  //Query for GETS
  Query: {
    //get the user that is logged in (by checking for context)
    me: async (_parent, args, context) => {
      if (context.user) {
        const foundUser = await User.findOne({ username: username })
          .select("-__v -password")
          .populate("books");

        return foundUser;
      }

      throw new AuthenticationError("Cannot find user!");
    },
  },

  //Mutations for PUT, POST, DELETES

  Mutation: {
    //create a new user
    addUser: async (_parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });

      if (!user) {
        throw new AuthenticationError("Something is wrong!");
      }

      const token = signToken(user);
      return { token, user };
    },

    //login existing user
    login: async (_parent, { email, username }) => {
      const user = await User.findOne({
        $or: [{ email: email }, { username: username }],
      });
      if (!user) {
        throw new AuthenticationError("Cannot find user!");
      }
      //use method on User model to check password
      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Wrong password");
      }
      const token = signToken(user);

      return { token, user };
    },

    //if the user is logged in, save a book to the set of saved books
    saveBook: async (_parent, bookData, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookData.input } },
          { new: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError("You need to be logged in!");
    },

    //if the user is logged in, pull a book from the set to delete
    removeBook: async (_parent, bookData, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookData.bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("Must be logged in! !");
    },
  },
};

module.exports = resolvers;
