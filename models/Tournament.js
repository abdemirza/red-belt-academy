const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  tournament_id: {
    type: String,
  },
  name: {
    type: String,
  },
  event_date: {
    type: String,
  },
  last_entry: {
    type: String,
  },
  entry_fee: {
    type: Number,
  },
  categories: {
    type: Object,
    required: true,
  },
  tournamentStart: {
    type: Object,
    required: true,
  },
  isJudge: {
    type: Object,
    default: { zeroRequests: 0 },
  },
});
const Tournament = mongoose.model("Tournament", TournamentSchema);
module.exports = Tournament;
