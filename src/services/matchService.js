const Match = require('../models/matchModel');

exports.createMatch = async matchData => {
  const match = new Match(matchData);
  await match.save();

  // Populate the match with user details
  await match.populate('creator', 'username avatar');
  await match.populate('players.user', 'username avatar');

  return match;
};

exports.getUserMatches = async (userId, page = 1, limit = 10) => {
  const matches = await Match.find({
    'players.user': userId
  })
    .populate('creator', 'username avatar')
    .populate('players.user', 'username avatar')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Match.countDocuments({
    'players.user': userId
  });

  return {
    matches,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  };
};

exports.getMatch = async matchId => {
  return await Match.findById(matchId)
    .populate('creator', 'username avatar')
    .populate('players.user', 'username avatar');
};

exports.updateMatch = async (matchId, updateData) => {
  return await Match.findByIdAndUpdate(matchId, updateData, {
    new: true,
    runValidators: true
  })
    .populate('creator', 'username avatar')
    .populate('players.user', 'username avatar');
};

exports.deleteMatch = async matchId => {
  return await Match.findByIdAndDelete(matchId);
};

exports.getMatchesByGame = async (gameId, userId, page = 1, limit = 10) => {
  const matches = await Match.find({
    'game.bggId': gameId,
    'players.user': userId
  })
    .populate('creator', 'username avatar')
    .populate('players.user', 'username avatar')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Match.countDocuments({
    'game.bggId': gameId,
    'players.user': userId
  });

  return {
    matches,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  };
};
