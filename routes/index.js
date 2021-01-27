const express = require("express");
const router = express.Router();
const numberOfJudge = 3;
const passport = require("passport");
const mongoose = require("mongoose");
const Contestant = require("../models/Contestant");
const Tournament = require("../models/Tournament");
const User = require("../models/User");
const JoinedTournament = require("../models/JoinedTournament");
const challonge = require("challonge");
const Match = require("../models/Match");
const axios = require("axios");
const qs = require("qs");
const http = require("https");
const Razorpay = require("razorpay");
const fs = require("fs");
const client = challonge.createClient({
  apiKey: "KIQKKvTHPLeGKYdlzx4Dc1Gx6yD25Gg2AK705sPZ",
});
const checksum_lib = require("./checksum");
// Contestant.find({ _id: "5fe6d99d562542d14f6bfdd0" }, (err, data) => {
//   console.log(data);
// });

var instance = new Razorpay({
  key_id: process.env.RAZORPAYKEY,
  key_secret: process.env.RAZORPAYSECRET,
});

// client.tournaments.reset({
//   id: '5ff375adc68e8474767cbc24FU7',
//   callback: (err, data) => {
//     console.log(err, data);
//   }
// });
// client.participants.index({
//   id: "5ff375adc68e8474767cbc24FU7",
//   callback: (err, data) => {
//     console.log(data);
//   },
// });
// category='MU21'
// client.tournaments.create({
//   tournament: {
//     name: `Sangam Cup Male  Category : ${category}`,
//     url: `5ff3763ec68e8474767cbc25${category}`,
//     tournamentType: "single elimination",
//     start_at: `2021-01-20 00:00 IST`,
//   },
//   callback: (err, data) => {
//     if (err) console.log(err);
//   }})

function createTournament(tournament, category) {
  if (tournament.tournamentStart[category] == 0) {
    client.tournaments.create({
      tournament: {
        name: `${tournament.name}  Category : ${category}`,
        url: `${tournament._id}${category}`,
        tournamentType: "single elimination",
        start_at: `${tournament.event_date} 00:00 IST`,
      },
      callback: (err, data) => {
        if (err) console.log(err);
        Tournament.updateOne(
          { _id: tournament._id },
          {
            $set: { [`tournamentStart.${category}`]: 1 },
          },
          (err, data) => {
            if (err) res.send(err);
            console.log(data);
          }
        );
      },
    });
  }
}

// client.tournaments.show({
//   id: "5eecb7c8af61fd4ed0455065FU10",
//   callback: (err, data) => {
//     if (err) console.log(err);
//   },
// });
// client.matches.index({
//   id: "5ff3763ec68e8474767cbc25MSENIOR",
//   callback: (err, data) => {
//     if (err) console.log(err);
//     else console.log(data)
//   },
// });
// 5ff3763ec68e8474767cbc25MU7
// client.matches.index({
//   id: "5ff3763ec68e8474767cbc25MU7",
//   callback: (err, data) => {
//     console.log(err, data);
//   },
// });
// client.tournaments.destroy({
//   id: '5ef2570bad98502bc49c5d3bMU7',
//   callback: (err, data) => {
//     if(err)
//     console.log(err);
//   }
// });
// client.tournaments.start({
//   id: '5ef2570bad98502bc49c5d3bMU8',
//   callback: (err, data) => {
//     console.log(err, data);
//   }
// });
const { ensureAuthenticated } = require("../config/auth");
const { runInContext } = require("vm");

router.get("/", (req, res) => {
  res.render("index.ejs");
});
// ! Creating tournament section
router.get("/createTournament", ensureAuthenticated, (req, res) => {
  res.render("createTournament");
});
// ! Creating tournament form
router.post("/createTournament", ensureAuthenticated, (req, res) => {
  const { event_name, event_date, last_entry, mcat, fcat, fees } = req.body;
  // ! The value for fcat and mcat would be string if only one option is selected so to avoid that the conditions are defined
  (date_error = ""), (category_error = ""), (fee_error = ""), (error = false);
  if (last_entry >= event_date) {
    date_error = "Last Date of Entry cannot be ahead of Event Date ";
    error = true;
  }
  if (req.files == null)
    return res.status(404).send("You haven't uploaded the Rules");

  ruleBook = req.files.ruleBook;

  if (ruleBook.mimetype != "application/pdf")
    return res.status(404).send("Upload the rules in PDF file only .");
  categories = [];
  if (!fcat && !mcat) {
    category_error = "Please choose atleast one category";
    error = true;
  }
  if (parseInt(fees) < 300 || isNaN(parseInt(fees))) {
    fee_error = "Entry Fee cannot be less than Rs. 500";
    error = true;
  }
  if (error)
    return res.render("error", {
      category_error: category_error,
      fee_error: fee_error,
      date_error: date_error,
    });
  if (!mcat && typeof fcat == "string") categories.push(fcat);
  else if (!fcat && typeof mcat == "string") categories.push(mcat);
  else if (typeof fcat == "string" && typeof mcat == "string")
    categories.push(mcat, fcat);
  else if (typeof fcat == "string") {
    categories = [...categories, ...mcat];

    categories.push(fcat);
  } else if (typeof mcat == "string") {
    categories.push(mcat);
    categories = [...categories, ...fcat];
  }
  // MU9 FU12
  // ? Checking if either of the male or female categories is null
  else if (mcat == undefined) categories = [...fcat];
  else if (fcat == undefined) categories = [...mcat];
  else categories = [...mcat, ...fcat];
  obj1 = {};
  value = {};
  entry_fee = 500;
  startTournament = {};
  for (cat of categories) {
    obj1[cat] = [];
    startTournament[cat] = 0;
  }

  tournament_id = req.user.email;
  const newTournament = new Tournament({
    tournament_id: tournament_id,
    name: event_name,
    event_date: event_date,
    last_entry: last_entry,
    entry_fee: fees,
    tournamentStart: startTournament,
    categories: obj1,
  });
  // ! Tournaments created on challonge
  // for (category of Object.keys(obj1)) {
  //   client.tournaments.create({
  //     tournament: {
  //       name: `${event_name}  Category : ${category}`,
  //       url: `${newTournament._id}${category}`,
  //       tournamentType: "single elimination",
  //       start_at: `${event_date} 00:00 IST`,
  //     },
  //     callback: (err, data) => {
  //       if (err) res.send(err);
  //     },
  //   });
  // }

  newTournament.save().then(() => {
    ruleBook.mv(
      __dirname +
        `/../public/UserData/tournamentRules/${newTournament._id}.pdf`,
      function (err) {
        if (err) return res.status(500).send(err);
        else res.redirect("/myTournament");
      }
    );
  });
});
router.get("/mytournament", ensureAuthenticated, (req, res) => {
  Tournament.find({ tournament_id: req.user.email }, (err, tournaments) => {
    if (err) res.send(err);
    res.render("myTournaments", { tournaments: tournaments });
  });
});
router.get("/upcomingtournament", ensureAuthenticated, (req, res) => {
  Tournament.find((err, tournaments) => {
    if (err) res.send(err);
    res.render("upcomingTournament", { tournaments: tournaments });
  }).sort({ last_entry: 1 });
});
// ! For joining the tournament
router.get(
  "/jointournament/:tournament_id",
  ensureAuthenticated,
  (req, res) => {
    Tournament.findById(req.params.tournament_id, (err, tournament) => {
      res.render("tournamentcategory", { tournament: tournament.toObject() });
    });
  }
);
// ! Joining tournament
router.post("/jointournament", (req, res) => {
  if (
    req.body.razorpay_payment_id != undefined &&
    req.body.razorpay_signature != undefined
  ) {
    contestant_id = req.body.contestantId;
    category = req.body.category;
    tournament_id = req.body.tournamentId;
    Contestant.findOne({ _id: contestant_id }, (err, contestant) => {
      client.participants.create({
        participant_id: contestant_id,
        id: `${tournament_id}${category}`,
        participant: {
          name: `${contestant.name}`,
        },
        callback: (err, data) => {
          if (err) res.send(err);
          else {
            challonge_player_id = data.participant.id;
            challonge_tournament_id = data.participant.tournamentId;
            const newJoinedTournament = new JoinedTournament({
              contestant_id,
              tournament_id,
              category,
              challonge_player_id,
              challonge_tournament_id,
            });
            newJoinedTournament.save();
            Tournament.updateOne(
              { _id: tournament_id },
              {
                $push: { [`categories.${category}`]: contestant_id },
              },
              (err) => {
                if (err) res.send(err);
                else
                  res.redirect(`/jointournament/${tournament_id}/${category}`);
              }
            );

            Contestant.updateOne(
              { _id: contestant_id },
              {
                $set: {
                  [`joinedTournaments.${tournament_id}.${category}`]: `${data.participant.id}`,
                },
              },
              (err) => {
                if (err) res.send(err);
              }
            );
          }
        },
      });
    });
  } else {
    res.send("Payment Failed !!! Retry");
  }
});
// ! Particular categories
router.get(
  "/jointournament/:tournament_id/:category",
  ensureAuthenticated,
  (req, res) => {
    Contestant.find({ club_id: req.user.email }, (err, contestants) => {
      Tournament.findById(req.params.tournament_id, (err, tournament) => {
        createTournament(tournament, req.params.category);
        res.render("eligibleContestants", {
          fees: tournament.entry_fee,
          tournament_id: tournament._id,
          tournament_name: tournament.name,
          user_email: req.user.email,
          categories: Object.keys(tournament.categories),
          // ! for sending the list of joined candidates
          // ! Using Object.values to convert it into array
          joinedContestants: Object.values(
            tournament.categories[req.params.category]
          ),
          category: req.params.category,
          contestants: contestants,
        });
      });
    });
  }
);
router.get("/editTournament/:id", ensureAuthenticated, (req, res) => {
  Tournament.findById(req.params.id, (err, tournament) => {
    res.render("editTournament.ejs", { tournament: tournament });
  });
});
// ! Edit Tournament Details
router.post("/editTournament/:id", ensureAuthenticated, (req, res) => {
  id = req.params.id;
  date_error = "";
  if (req.body.last_entry >= req.body.event_date) {
    date_error = "Last Date of Entry cannot be ahead of Event Date ";
    return res.render("error", {
      category_error: "",
      fee_error: "",
      date_error: date_error,
    });
  }
  newObj = {};
  categories = [];
  if (req.body.categories != undefined) {
    newCategories = req.body.categories;
    if (typeof req.body.categories == "string")
      categories.push(req.body.categories);
    else categories = [...categories, ...newCategories];
    for (key of categories) newObj[key] = [];
  }
  Tournament.findById(id, (err, tournament) => {
    tournament = tournament.toObject();
    Tournament.updateOne(
      { _id: id },
      {
        $set: {
          name: req.body.name,
          last_entry: req.body.last_entry,
          event_date: req.body.event_date,
          categories: { ...newObj, ...tournament.categories },
        },
      },
      (err, status) => {
        if (err) res.send(err);
        else res.redirect("/mytournament");
      }
    );
    for (key in tournament.categories) newObj[key] = [];
  });
});
// ! routes to show categories for the bracket system
router.get(
  "/tournamentStatus/:tournament_id",
  ensureAuthenticated,
  (req, res) => {
    Tournament.findOne({ _id: req.params.tournament_id }, (err, tournament) => {
      if (err) res.send(err);
      res.render("tournamentStatsCategory", { tournament: tournament });
    });
  }
);
// ! Show the actual brackets
router.get(
  "/tournamentStatus/:tournament_id/:category",
  ensureAuthenticated,
  (req, res) => {
    Tournament.findOne({ _id: req.params.tournament_id }, (err, tournament) => {
      createTournament(tournament, req.params.category);
      res.render("tournamentBracket", {
        tournament_id: req.params.tournament_id,
        category: req.params.category,
      });
    });
  }
);
// ! A  User can send a request to become a judge
router.post(
  "/judgeRequest/:tournament_id/:user_id",
  ensureAuthenticated,
  (req, res) => {
    User.updateOne(
      { _id: req.params.user_id },
      {
        $set: {
          [`isJudge.${req.params.tournament_id}`]: 0,
        },
      },

      (err, status) => {
        if (err) res.send(err);
      }
    );
    // ! Updating a user request in a tournament record
    Tournament.updateOne(
      { _id: req.params.tournament_id },
      {
        $set: {
          [`isJudge.${req.params.user_id}`]: 0,
        },
      },

      (err, status) => {
        if (err) res.send(err);
        else res.redirect("/upcomingTournament");
      }
    );
  }
);
// ! User who hosted a tournament can see judge requests
router.get("/judgeRequest/:tournament_id", ensureAuthenticated, (req, res) => {
  Tournament.findOne({ _id: req.params.tournament_id }, (err, tournament) => {
    requestIds = Object.keys(tournament.isJudge);
    User.find(
      {
        _id: {
          $in: requestIds,
        },
      },
      (err, judgeRecords) => {
        if (err) res.send(err);
        else if (judgeRecords)
          res.render("judgeRequest", {
            judgeRecords: judgeRecords,
            tournament_id: req.params.tournament_id,
          });
      }
    );
  });
});
// ! Accept a judge request
router.post(
  "/judgeApproved/:tournament_id/:judge_id",
  ensureAuthenticated,
  (req, res) => {
    Tournament.findOne({ _id: req.params.tournament_id }, (err, tournament) => {
      if (Object.values(tournament.isJudge).reduce((a, b) => a + b, 0) == 3)
        res.send("You already have 3 judges");
    });
    Tournament.updateOne(
      { _id: req.params.tournament_id },
      {
        $set: {
          [`isJudge.${req.params.tournament_id}`]: 1,
        },
      },
      (err) => {
        if (err) res.send(err);
      }
    );
    User.updateOne(
      { _id: req.params.judge_id },
      {
        $set: {
          [`isJudge.${req.params.tournament_id}`]: 1,
        },
      },
      (err) => {
        if (err) res.send(err);
        else res.redirect("/judgeRequest/" + req.params.tournament_id);
      }
    );
  }
);
router.get("/contestantDetails", ensureAuthenticated, (req, res) => {
  Contestant.find(
    { club_id: req.user.email, joinedTournaments: { $exists: true } },
    (err, contestants) => {
      if (err) res.send(err);
      res.render("contestantDetails", { contestants: contestants });
    }
  );
});
router.get(
  "/contestantDetails/:contestant_id",
  ensureAuthenticated,
  (req, res) => {
    Contestant.findOne({ _id: req.params.contestant_id }, (err, contestant) => {
      if (err) res.send(err);
      ids = Object.keys(contestant.joinedTournaments);
      Tournament.find(
        {
          _id: { $in: ids },
        },
        (err, tournaments) => {
          res.render("joinedTournaments", {
            tournaments: tournaments,
            contestant: contestant,
          });
        }
      );
    });
  }
);
// ! checking if a match is there or not
router.get(
  "/matchStat/:tournament_url/:contestant_id/:player_id",
  (req, res) => {
    console.log(req.params.tournament_url.match(/[A-Z]+[0-9]+/))
    tournament_id = req.params.tournament_url;
    player_id = req.params.player_id;
    tournament_id = tournament_id.match(/[a-z0-9]{24}/)[0];
    category = req.params.tournament_url.match(/([A-Z]+[0-9]+)|([A-Z]+)/)[0];
    globalTournament = [];
    console.log(`${tournament_id} ${category} ${req.params.tournament_url}`)
    Tournament.findOne({ _id: tournament_id }, (err, tournament) => {
      globalTournament = tournament;
    });
    Contestant.findOne(
      { _id: req.params.contestant_id },
      (err, currentPlayerDetails) => {
        if (err) res.send(err);
        client.matches.index({
          id: `${req.params.tournament_url}`,
          callback: (err, matches) => {
            console.log(matches)
            //? If the match is not started yet
            if(err) res.send(err)
            if (Object.keys(matches).length == 0)
              res.send({
                err: "No Matches Started , Checkout the Tournament Stats ",
              });
            else {
              matchData = [];
              playerIds = [];
              // ? Finding if a match contain the current contestant
              // ? Then finding out the playerId of the current contestant and other contestant
              for (index in matches) {
                if (
                  matches[index]["match"]["player1Id"] ==
                    req.params.player_id ||
                  matches[index]["match"]["player2Id"] == req.params.player_id
                ) {
                  player1Id = matches[index]["match"]["player1Id"];
                  player2Id = matches[index]["match"]["player2Id"];
                  currentPlayerId =
                    player1Id == req.params.player_id ? player1Id : player2Id;
                  otherPlayerId =
                    player1Id != req.params.player_id ? player1Id : player2Id;
                  playerIds.push(matches[index]["match"]["player1Id"]);
                  playerIds.push(matches[index]["match"]["player2Id"]);
                  if (player1Id != undefined && player2Id != undefined) {
                    matchData.push({
                      match_id: matches[index]["match"]["id"],
                      player1Id: matches[index]["match"]["player1Id"],
                      player2Id: matches[index]["match"]["player2Id"],
                      round: matches[index]["match"]["round"],
                    });

                    var currentPlayer = {};
                  }
                }
              }
              JoinedTournament.find(
                {
                  challonge_player_id: {
                    $in: playerIds,
                  },
                },
                (err, result) => {
                  for (i = 0; i < matchData.length; i++) {
                    player1Data = result.find(
                      (x) => x.challonge_player_id == matchData[i].player1Id
                    );
                    player2Data = result.find(
                      (x) => x.challonge_player_id == matchData[i].player2Id
                    );
                    if (player1Data.contestant_id != undefined)
                      matchData[i]["player1Details"] =
                        player1Data.contestant_id;
                    if (player2Data != undefined)
                      matchData[i]["player2Details"] =
                        player2Data.contestant_id;
                  }
                  async function upsertMany(matchData) {
                    if (matchData.length > 0) {
                      for (const entry of matchData) {
                        await Match.findOneAndUpdate(
                          entry,
                          entry,
                          { upsert: true },
                          (err, data) => {
                            Match.find({ $or: matchData })
                              .populate("player1Details")
                              .populate("player2Details")
                              .exec()
                              .then((matches) => {
                                res.render("matchOverview", {
                                  matchStats: matches,
                                  tournamentUrl: req.params.tournament_url,
                                  currentPlayerId: currentPlayerDetails._id,
                                  tournament: globalTournament,
                                  category: category,
                                });
                              });
                          }
                        );
                      }
                    } else
                      res.render("matchOverview", {
                        matchStats: [],
                        tournamentUrl: req.params.tournament_url,
                        currentPlayerId: currentPlayerDetails._id,
                      });
                  }
                  upsertMany(matchData);
                }
              );
            }
          },
        });
      }
    );
  }
);
router.post("/uploadVideo/:matchId/:playerId/:idNumber", (req, res) => {
  // ? Defining Regular expression to only store youtube video id
  videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  video_id = req.body.videoId.match(videoIdRegex);
  video_id = video_id[video_id.length-1]
  Match.findOneAndUpdate(
    { match_id: req.params.matchId },
    {
      $set: {
        [`player${req.params.idNumber}VideoId`]: video_id,
      },
    },
    (err, result) => {
      if (err) res.send(err);
      else
        res.redirect(
          `/matchStat/${req.body.tournamentUrl}/${req.body.contestantId}/${req.body.playerId}`
        );
    }
  );
});
// ? Get a list of matches to get scored by judge
// ? Get a list of matches to get scored by judge
// ! Judging error
router.post("/judgeMatch/:tournamentId", (req, res) => {
  tournament_id = req.params.tournamentId.match(/[a-z0-9]{24}/)[0];
  globalTournament = [];
  Tournament.findOne({ _id: tournament_id }, (err, tournament) => {
    globalTournament = tournament;
  });
  client.matches.index({
    id: `${tournament_id}${req.body.category}`,
    callback: (err, matches) => {
      if (err) res.send("Tournament has not started yet.");
      else if (matches == undefined) res.send("Tournament has not started yet");
      let matchData = [];
      let playerIds = [];
      for (index in matches) {
        player1Id = matches[index]["match"]["player1Id"];
        player2Id = matches[index]["match"]["player2Id"];
        playerIds.push(matches[index]["match"]["player1Id"]);
        playerIds.push(matches[index]["match"]["player2Id"]);
        if (player1Id != undefined && player2Id != undefined) {
          matchData.push({
            match_id: matches[index]["match"]["id"],
            player1Id: matches[index]["match"]["player1Id"],
            player2Id: matches[index]["match"]["player2Id"],
            round: matches[index]["match"]["round"],
          });
        }
      }
      JoinedTournament.find(
        {
          challonge_player_id: {
            $in: playerIds,
          },
        },
        (err, result) => {
          for (i = 0; i < matchData.length; i++) {
            player1Data = result.find(
              (x) => x.challonge_player_id == matchData[i].player1Id
            );
            player2Data = result.find(
              (x) => x.challonge_player_id == matchData[i].player2Id
            );
            if (player1Data.contestant_id != undefined)
              matchData[i]["player1Details"] = player1Data.contestant_id;
            if (player2Data != undefined)
              matchData[i]["player2Details"] = player2Data.contestant_id;
          }
          async function upsertMany(matchData) {
            for (const entry of matchData) {
              await Match.findOneAndUpdate(
                entry,
                entry,
                { upsert: true },
                (err, data) => {
                  Match.find({ $or: matchData })
                    .populate("player1Details")
                    .populate("player2Details")
                    .exec()
                    .then((matches) => {
                      res.render("scoreMatches", {
                        matches: matches,
                        tournamentId: tournament_id,
                        category: req.body.category,
                        judgeId: req.user._id,
                        tournament: globalTournament,
                      });
                    });
                }
              );
            }
          }

          upsertMany(matchData);
        }
      );
    },
  });
});
// ? Submitting score by a judge
router.post("/submitScore", (req, res) => {
  if (req.body.player1Score == undefined) {
    obj = {
      $set: {
        [`player2Score.${req.body.judgeId}`]: parseFloat(req.body.player2Score),
      },
    };
  }
  if (req.body.player2Score == undefined) {
    obj = {
      $set: {
        [`player1Score.${req.body.judgeId}`]: parseFloat(req.body.player1Score),
      },
    };
  }
  Match.findOneAndUpdate({ match_id: req.body.matchId }, obj, (err, match) => {
    res.redirect(
      `/judgeMatch/${
        req.body.tournamentId.match(/[a-z0-9]{24}/)[0] + req.body.category
      }/${req.body.matchId}`
    );
  });
});
// ! **************************************************************
// ? Retrieve list of matches using get request
router.get("/judgeMatch/:tournamentId", ensureAuthenticated, (req, res) => {
  category = req.params.tournamentId.match(/[A-Z]+[0-9]+/)[0];
  tournamentId = req.params.tournamentId.match(/[a-z0-9]{24}/)[0];
  globalTournament = [];
  Tournament.findOne({ _id: tournamentId }, (err, tournament) => {
    globalTournament = tournament;
  });
  client.matches.index({
    id: `${req.params.tournamentId.match(/[a-z0-9]{24}/)[0]}${category}`,
    callback: (err, matches) => {
      if (err) res.send("Tournament has not started yet.");
      else if (matches == undefined) res.send("Tournament has not started yet");
      let matchData = [];
      let playerIds = [];
      for (index in matches) {
        player1Id = matches[index]["match"]["player1Id"];
        player2Id = matches[index]["match"]["player2Id"];
        playerIds.push(player1Id);
        playerIds.push(player2Id);
        if (player1Id != undefined && player2Id != undefined) {
          matchData.push({
            match_id: matches[index]["match"]["id"],
            player1Id: matches[index]["match"]["player1Id"],
            player2Id: matches[index]["match"]["player2Id"],
            round: matches[index]["match"]["round"],
          });
        }
      }
      JoinedTournament.find(
        {
          challonge_player_id: {
            $in: playerIds,
          },
        },
        (err, result) => {
          for (i = 0; i < matchData.length; i++) {
            player1Data = result.find(
              (x) => x.challonge_player_id == matchData[i].player1Id
            );
            player2Data = result.find(
              (x) => x.challonge_player_id == matchData[i].player2Id
            );
            if (player1Data.contestant_id != undefined)
              matchData[i]["player1Details"] = player1Data.contestant_id;
            if (player2Data != undefined)
              matchData[i]["player2Details"] = player2Data.contestant_id;
          }
          async function upsertMany(matchData) {
            for (const entry of matchData) {
              await Match.findOneAndUpdate(
                entry,
                entry,
                { upsert: true },
                (err, data) => {
                  Match.find({ $or: matchData })
                    .populate("player1Details")
                    .populate("player2Details")
                    .exec()
                    .then((matches) => {
                      res.render("scoreMatches", {
                        matches: matches,
                        tournamentId: req.params.tournamentId,
                        judgeId: req.user._id,
                        category: category,
                        tournament: globalTournament,
                      });
                    });
                }
              );
            }
          }
          upsertMany(matchData);
        }
      );
    },
  });
});
// ? Get request for declaring winner
router.get(
  "/judgeMatch/:tournamentId/:matchId",
  ensureAuthenticated,
  (req, res) => {
    Match.findOne({ match_id: req.params.matchId }, (err, match) => {
      if (
        Object.keys(match.player1Score).length == numberOfJudge &&
        Object.keys(match.player2Score).length == numberOfJudge
      ) {
        function sum(arr) {
          s = 0;
          for (i = 0; i < arr.length; i++) s += arr[i];
          return s;
        }
        // ! Problem yahan hai *******************************
        player1Score = sum(Object.values(match.player1Score));
        player2Score = sum(Object.values(match.player2Score));
        winnerId =
          player1Score > player2Score ? match.player1Id : match.player2Id;
        loserId =
          player1Score < player2Score ? match.player1Id : match.player2Id;
        fs.appendFile(
          "logs.txt",
          `\nPlayer1Score : ${player1Score}\nPlayer2Score : ${player2Score}\nPlayer1Condition : ${
            player1Score > player2Score
          }\nWinnerId : ${winnerId}`,
          function (err) {
            if (err) throw err;
          }
        );
        Match.findOneAndUpdate(
          { match_id: req.params.matchId },
          {
            isWinner: winnerId,
          },
          (err) => {
            if (err) res.send(err);
          }
        );
        client.matches.update({
          id: req.params.tournamentId,
          matchId: req.params.matchId,
          match: {
            scoresCsv: `${player1Score > player2Score ? 1 : 0}-${
              player2Score > player1Score ? 1 : 0
            }`,
            winnerId: winnerId,
            loserId: loserId,
          },
          callback: (err, data) => {
            if (err) res.send(err);
            res.redirect(`/judgeMatch/${req.params.tournamentId}`);
          },
        });
      } else res.redirect(`/judgeMatch/${req.params.tournamentId}`);
    });
  }
);
// ? Payment Gateway
router.post("/payment", (req, res) => {
  const {
    tournamentId,
    category,
    contestantId,
    fees,
    tournamentName,
    email,
    contestantName,
  } = req.body;
  // instance.orders.fetch("order_GJefDNUXuYLRHo").then((data) => {
  //   console.log(data);
  // });
  //! This will create a problem in future as the payment id has a dummy text
  const postData = {
    tournamentId: tournamentId,
    category: category,
    contestantId: contestantId,
    razorpay_payment_id: "alreadyDone",
    razorpay_signature: "alreadyDone",
  };

  Contestant.findOne({ _id: contestantId }, (err, foundContestant) => {
    //! If payment has already been done but the user was unable to join
    if (
      foundContestant.payments &&
      foundContestant.payments[`${tournamentId}${category}`] != undefined
    ) {
      instance.orders
        .fetch(foundContestant.payments[`${tournamentId}${category}`])
        .then((paymentData) => {
          if (paymentData.amount_due == 0) {
            //! checking if  the payment has been done
            axios
              .post(`${process.env.URL}/joinTournament`, qs.stringify(postData))
              .then((data) => {
                res.redirect(`/joinTournament/${tournamentId}/${category}`);
              })
              .catch((err) => {
                console.error(err);
              });
          } else {
            // ! If transaction failed but orderId is generated
            Contestant.findOne(
              { _id: contestantId },
              (err, foundContestant) => {
                instance.orders
                  .fetch(foundContestant.payments[`${tournamentId}${category}`])
                  .then((paymentData) => {
                    res.render("demo", {
                      data: req.body,
                      orderIdData: paymentData,
                      key: process.env.RAZORPAYKEY,
                    });
                  });
              }
            );
          }
        });
    } else {
      // ! Fresh Payments
      var params = {
        amount: req.body.fees * 100,
        currency: "INR",
        receipt: "RED_" + new Date().getTime(),
        payment_capture: "1",
      };
      instance.orders.create(params).then((paymentData) => {
        Contestant.updateOne(
          { _id: contestantId },
          {
            $set: { [`payments.${tournamentId}${category}`]: paymentData.id },
          },
          (err, modifiedData) => {
            if (err) res.send(err);
            res.render("demo", {
              data: req.body,
              orderIdData: paymentData,
              key: process.env.RAZORPAYKEY,
            });
          }
        );
      });
    }
  });
});
router.post("/paymentSuccess", (req, res) => {
  if (
    req.body.razorpay_payment_id != undefined &&
    req.body.razorpay_signature != undefined
  ) {
  }
});
// router.post("/callback/:tournamentId/:contestantId/:category", (req, res) => {
//   var body = "";
//   if (req.body.RESPCODE == "01") {
//     res.render("demo", {
//       tournament: req.params.tournamentId,
//       contestantId: req.params.contestantId,
//       category: req.params.category,
//     });
//   } else res.send("Payment Failed...");
//   req.on("data", function (data) {
//     body += data;
//   });

//   req.on("end", function () {
//     var html = "";
//     var post_data = qs.parse(body);

//     // received params in callback
//     console.log("Callback Response: ", post_data, "\n");
//     html += "<b>Callback Response</b><br>";
//     for (var x in post_data) {
//       html += x + " => " + post_data[x] + "<br/>";
//     }
//     html += "<br/><br/>";

//     // verify the checksum
//     var checksumhash = post_data.CHECKSUMHASH;
//     // delete post_data.CHECKSUMHASH;
//     var result = checksum_lib.verifychecksum(
//       post_data,
//       PaytmConfig.key,
//       checksumhash
//     );
//     console.log("Checksum Result => ", result, "\n");
//     html += "<b>Checksum Result</b> => " + (result ? "True" : "False");
//     html += "<br/><br/>";

//     // Send Server-to-Server request to verify Order Status
//     var params = { MID: PaytmConfig.mid, ORDERID: post_data.ORDERID };

//     checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {
//       params.CHECKSUMHASH = checksum;
//       post_data = "JsonData=" + JSON.stringify(params);

//       var options = {
//         hostname: "securegw-stage.paytm.in", // for staging
//         // hostname: 'securegw.paytm.in', // for production
//         port: 443,
//         path: "/merchant-status/getTxnStatus",
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           "Content-Length": post_data.length,
//         },
//       };

//       // Set up the request
//       var response = "";
//       var post_req = https.request(options, function (post_res) {
//         post_res.on("data", function (chunk) {
//           response += chunk;
//         });

//         post_res.on("end", function () {
//           console.log("S2S Response: ", response, "\n");

//           var _result = JSON.parse(response);
//           html += "<b>Status Check Response</b><br>";
//           for (var x in _result) {
//             html += x + " => " + _result[x] + "<br/>";
//           }

//           res.writeHead(200, { "Content-Type": "text/html" });
//           res.write(html);
//           res.end();
//         });
//       });

//       // post the data
//       post_req.write(post_data);
//       post_req.end();
//     });
//   });
// });
router.get("/downloadRuleBook/:tournamentId", (req, res) => {
  var file =
    __dirname +
    "/../public/UserData/tournamentRules/" +
    req.params.tournamentId +
    ".pdf";
  res.download(file, function (err) {
    if (err) {
      res.send(err);
    }
  });
});

// ! Starting the tournament
router.get(
  "/startTournament/:tournamentId",
  ensureAuthenticated,
  (req, res) => {
    Tournament.findOne({ _id: req.params.tournamentId }, (err, tournament) => {
      if (err) res.send(err);
      if (req.user.email != tournament.tournament_id)
        res.send("Log into your main account");
      //  for (category of Object.keys(obj1)) {
      //   client.tournaments.create({
      //     tournament: {
      //       name: `${event_name}  Category : ${category}`,
      //       url: `${newTournament._id}${category}`,
      //       tournamentType: "single elimination",
      //       start_at: `${event_date} 00:00 IST`,
      //     },
      //     callback: (err, data) => {
      //       if (err) res.send(err);

      //       const newTournamentId = new TournamentId({
      //         tournament_id: { [`${newTournament._id}`]: `${data.tournament.id}` },
      //       });
      //       newTournamentId.save();
      //     },
      //   });
      //}

      categories = Object.keys(tournament.categories);
      for (category of categories) {
        client.tournaments.start({
          id: req.params.tournamentId + categories,
          callback: (err, data) => {
            if (err) res.send(err);
          },
        });
      }
      res.redirect("/myTournament");
    });
  }
);
router.get(
  "/judgeContestantsTournamentList",
  ensureAuthenticated,
  (req, res) => {
    tournamentKeys = [];
    for (tournamentKey of Object.keys(req.user.isJudge)) {
      if (req.user.isJudge[tournamentKey] == 1)
        tournamentKeys.push(tournamentKey);
    }
    Tournament.find(
      {
        _id: {
          $in: tournamentKeys,
        },
      },
      (err, tournaments) => {
        res.render("judgeContestantsTournamentList", {
          tournaments: tournaments,
        });
      }
    );
  }
);
router.get("/termsandconditions", (req, res) => {
  res.render("terms&condition");
});
router.get("/privacypolicy", (req, res) => {
  res.render("privacyPolicy");
});
router.get("/help", (req, res) => {
  res.render("help");
});
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  Contestant.find({ club_id: req.user.email }, (err, contestants) => {
    if (err) res.send(err);
    res.render("dashboard", {
      user: req.user,
      contestants: contestants,
    });
  });
});
module.exports = router;
