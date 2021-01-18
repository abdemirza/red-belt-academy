const mongoose = require("mongoose");

const JoinedTournamentSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  contestant_id: {
    type: String,
  },
  tournament_id: {
    type: String,
  },
  category: {
    type: String,
  },
  challonge_player_id: {
    type: String,
  },
  challonge_tournament_id: {
    type: String,
  },
  match: {
    type: Object,
    default : {}
  },
});
const JoinedTournament = mongoose.model(
  "JoinedTournament",
  JoinedTournamentSchema
);
module.exports = JoinedTournament;
