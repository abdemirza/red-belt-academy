export var createMatches = async function (matchData,category,renderPage) {
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
            res.render(renderPage, {
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
};
