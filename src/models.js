const mongoose = require("mongoose")
const moment = require("moment")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

//CREATING A MONGODB SCHEMA
function buildModel(name, schema) {
    return mongoose.model(name, new Schema(schema, {timestamps: true}))
}

const Folder = buildModel("Folder", {
    name: String,
    description: String,
    shareWith: [{
        kind: String,
        item: {type: ObjectId, refPath: "shareWith.kind"}
    }],
    parent: {type: ObjectId, ref: "Folder"},
})
module.exports.Folder = Folder
module.exports.Team = Folder.discriminator("Team", new Schema({}, {timestamps: true}))
module.exports.User = buildModel("User", {
    name: {
        type: String,
        default: ""
    },
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: true
    },
    password: String,
    jobTitle: {
        type: String,
        default: ""
    },
    avatarColour: String,
    team: {
        type: ObjectId,
        ref: "Team"
    },
    role: String,
    status: String
})

module.exports.Group = buildModel('Group', {
    team: { type: ObjectId, ref: 'Team' },
    name: String,
    initials: String,
    avatarColour: String,
    users: [{ type: ObjectId, ref: 'User' }],
  })
