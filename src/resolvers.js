// server/src/resolvers.js
const { GraphQLScalarType } = require("graphql");
const moment = require("moment");
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const nodeMailer = require('nodemailer');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const {User, Team, Folder} = require('./models');
const { welcomeEmail } = require('./email');
const { getUserId } = require('./utils');

const transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.FROM_EMAIL,
      pass: process.env.GMAIL_PASSWORD
    }
})

const JWT_SECRET = process.env.JWT_SECRET;

function randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random()) ]
}

const avatarColors = [
    "D81B60","F06292","F48FB1","FFB74D","FF9800","F57C00","00897B","4DB6AC","80CBC4",
    "80DEEA","4DD0E1","00ACC1","9FA8DA","7986CB","3949AB","8E24AA","BA68C8","CE93D8"
  ]

const resolvers = {
    Query: {
        async getTeam(_, args, context) {
            const userId = getUserId(context);
            const user = await User.findById(userId);
            return await Team.findById(user.team);
        },
        async getFolder(_, {id}, context) {
            const userId = getUserId(context);
            return await Folder.findById(id).populate('shareWith');
        },
        async getFolders(_, {parent}, context) {
            const userId = getUserId(context);
            if (parent) {
                return await Folder.find({parent});
            } else {
                const user = await User.findById(id);
                const groups = await Group.find({users: ObjectId(userId)}, '_id');
                const ids = groups.map(o => o.id).concat(
                    ['External User', 'Collaborator'].includes(user.role) ?
                    [ObjectId(userId)] :
                    [ObjectId(userId), user.team]
                );
                return await Folder.find({'shareWith.item': ids}).populate('shareWith')
            }
        },
    },
    Mutation: {
        async captureEmail(_, { email }) {
            const isEmailTaken = await User.findOne({email})
            if (isEmailTaken) {
                throw new Error("This email is already taken")
            }
            const user = await User.create({
                email,
                role: "Owner",
                status: "Pending"
            });
            transporter.sendMail(welcomeEmail(email, user))
            return user
        },
        async signUp (_, {id, firstName, lastName, password}){
            const user = await User.findById(id);
            const common = {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                avatarColour: randomChoice(avatarColors),
                password: await bcrypt.hash(password, 10),
                status: 'Active',
            };
            if (user.role === 'Owner') {
                const team = await Team.create({
                    name: `${common.name}'s Team`,
                });
                user.set({
                    ...common,
                    team: team.id,
                    jobTitle: 'CEO/Owner/Founder',
                });
            } else {
                user.set(common);
            }

            await user.save();
            const token = jwt.sign({
                id: user.id,
                email: user.email,
            },
            JWT_SECRET,
            );
            return {
                token,
                user
            };
        },
        async login (_, {email, password}) {
            const user = await User.findOne({email});
            if(!user){
                throw new Error("No user with that email");
            }
            const valid = await bcrypt.compare(password, user.password);
            if(!valid) {
                throw new Error("Passwords do not match");
            }
            const token = jwt.sign({id: user.id, email}, JWT_SECRET);
            return {token, user}
        },
    },
    Date: new GraphQLScalarType({
        name: "Date",
        description: "Date custom scalar type",
        parseValue: (value) => moment(value).toDate(), //when received a value from client
        serialize: (value) => value.getTime(), //the value that is being sent to the client
        parseLiteral: (ast) => ast
    })
}
module.exports = resolvers
