const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    //get one user
    getSingleUser: async (_parent, userData, context) => {
      if (context.user) {
        const foundUser = await User.findOne({
          $or: [
            { _id: userData._id },
            { username: userData.username },
          ],
        });

        return foundUser;
      }

      throw new AuthenticationError("Cannot find user!");
    },
  },

  //---------------------------------------------------

  Mutation: {
    createUser: async (_parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });

      if (!user) {
        throw new AuthenticationError("Something is wrong!");
      }

      const token = signToken(user);
      return { token, user };
    },

    login: async (_parent, { email, username, password }) => {
      const user = await User.findOne({
        $or: [{ email: email }, { username: username }],
      });
      if (!user) {
        throw new AuthenticationError("Cannot find user!");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Wrong password");
      }
      const token = signToken(user);

      return { token, user };
    },

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


    removeBook: async (_parent, bookData, context) => {
      if(context.user) {
        const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: { bookId: bookData.bookId } } },
            { new: true }
        );

        return updatedUser;
        }

        throw new AuthenticationError('You need to be logged in!');
    },

  },
};

module.exports = resolvers;
