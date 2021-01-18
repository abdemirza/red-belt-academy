const mongoose = require("mongoose");
const { ObjectID } = require("mongodb");

const MatchSchema = new mongoose.Schema({
  match_id: {
    type: String,
  },
  player1Id: {
    type: String,
  },
  player2Id: {
    type: String,
  },
  player1VideoId: {
    type: String,
    default: "blank",
  },
  player2VideoId: {
    type: String,
    default: "blank",
  },
  player1Score: {
    type: Object,
    default:{'noOne':0}
  },
  player2Score: {
    type: Object,
    default:{'noOne':0}
  },
  isWinner:{
    type:String,
  },
  round:{
    type: Number,
  },
  tournamentCategory:{
    type:String,
  },
  tournamentId:{
    type:ObjectID,
  },
  player1Details: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contestant",
  },
  player2Details: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contestant",
  },
});
const Match = mongoose.model("Match", MatchSchema);
module.exports = Match;
