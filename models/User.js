const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
  },
  role:{
    type : String,
    required:true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: Object,
    required: false,
  },
  club_data: {
    type: Object,
    required: false,
  },
  isJudge: {
    type: Object,
    default: { zeroRequests: 0 },
  },
  date: {
    type: String,
    default: Date(Date.now()).toLocaleString().split(",")[0],
  },

  active: {
    type: Boolean,
    default: true,
  },
  verificationKey: {
    type: String,
  },
});
const User = mongoose.model("User", UserSchema);
module.exports = User;
