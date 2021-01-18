const mongoose = require("mongoose");

const TournamentIdSchema = new mongoose.Schema({
  tournament_id: {
    type: Object,
  },
  
});
const TournamentId = mongoose.model("TournamentId", TournamentIdSchema);
module.exports = TournamentId;
