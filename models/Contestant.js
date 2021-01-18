const mongoose = require("mongoose");

const ContestantSchema = new mongoose.Schema({
  club_id: {
    type: String,
    required: true,
  },
  pid: {
    type: Number,
  },
  name: {
    type: String,
  },
  gender: {
    type: Boolean,
  },
  state: {
    type: String,
  },
  birthday: {
    type: String,
  },
  age: {
    type: Number,
  },
  payments: {
    type: Object,
  },
  weight: {
    type: String,
  },
  height: {
    type: String,
  },
  joinedTournaments: {
    type: Object,
  },
 
});
const Contestant = mongoose.model("Contestant", ContestantSchema);
module.exports = Contestant;
