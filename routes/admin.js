const express = require("express");
const router = express.Router();
const numberOfJudge = 3;
const passport = require("passport");
const mongoose = require("mongoose");
const Contestant = require("../models/Contestant");
const Tournament = require("../models/Tournament");
const getAge = require("age-by-birthdate");
const User = require("../models/User");
const JoinedTournament = require("../models/JoinedTournament");
const challonge = require("challonge");
const Match = require("../models/Match");
const axios = require("axios");
const qs = require("qs");
const http = require("https");
const Razorpay = require("razorpay");
const fs = require("fs");
const { ensureAuthenticated } = require("../config/auth");
const client = challonge.createClient({
  apiKey: "KIQKKvTHPLeGKYdlzx4Dc1Gx6yD25Gg2AK705sPZ",
});
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  const tournaments = await Tournament.find({});
  res.render("adminDashboard", { tournaments: tournaments });
});
router.post("/tournament/checkoutStats", async (req, res) => {
  const tournamentId = req.body.tournamentId;
  console.log(tournamentId)
  const category = req.body.category;
  const matches = await Match.find({
    tournamentId: tournamentId,
    category: category,
  })
    .populate("player1Details")
    .populate("player2Details")
    .exec();
  function getJudges(obj) {
    keys = Object.keys(obj);
    list = [];
    for (key of keys) {
      if (obj[key] == 1) list.push(key);
    }
    return list;
  }
  const tournament = await Tournament.findOne({ _id: tournamentId });
  const judgesId = getJudges(tournament.isJudge);
  const judges = await User.find({ _id: { $in: judgesId } });
  // const joinedContestantIds = tournament.categories[category];
  // console.log(joinedContestantIds);
  // const joinedContestant = await Contestant.find({
  //   _id: { $in: joinedContestantIds },
  // });
  // console.log(joinedContestant);
  console.log(matches);
  res.render("adminCategoryMatches", {
    matches: matches,
    tournament: tournament,
    judges: judges,
    category: category,
  });
});
module.exports = router;
