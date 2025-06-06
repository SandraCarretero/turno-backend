const User = require('../models/userModel');
const Match = require('../models/matchModel');

exports.updateProfile = async (userId, updateData) => {
  const { username, email } = updateData;

  const existingUser = await User.findOne({
    $and: [{ _id: { $ne: userId } }, { $or: [{ email }, { username }] }]
  });

  if (existingUser) {
    throw new Error(
      existingUser.email === email
        ? 'Email already exists'
        : 'Username already exists'
    );
  }

  return await User.findByIdAndUpdate(
    userId,
    { username, email },
    { new: true, runValidators: true }
  ).select('-password');
};

exports.searchUsers = async (query, currentUserId) => {
  if (!query || query.length < 2) {
    return [];
  }

  const regex = new RegExp(query, 'i');

  try {
    const users = await User.find({
      $or: [{ username: regex }, { email: regex }]
    })
      .select('_id username email avatar')
      .limit(20);

    return users || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

exports.getUserStats = async userId => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const totalMatches = await Match.countDocuments({
    'players.user': userId
  });

  const matchesThisMonth = await Match.countDocuments({
    'players.user': userId,
    date: { $gte: startOfMonth }
  });

  const uniqueGamesThisMonth = await Match.distinct('game.bggId', {
    'players.user': userId,
    date: { $gte: startOfMonth }
  });

  const wins = await Match.countDocuments({
    'players.user': userId,
    'players.isWinner': true,
    $expr: {
      $in: [
        userId,
        {
          $map: {
            input: { $filter: { input: '$players', cond: '$$this.isWinner' } },
            as: 'winner',
            in: '$$winner.user'
          }
        }
      ]
    }
  });

  const mostPlayedGame = await Match.aggregate([
    { $match: { 'players.user': userId } },
    {
      $group: {
        _id: '$game.bggId',
        count: { $sum: 1 },
        game: { $first: '$game' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const mostPlayedWithFriend = await Match.aggregate([
    { $match: { 'players.user': userId } },
    { $unwind: '$players' },
    { $match: { 'players.user': { $ne: userId } } },
    { $group: { _id: '$players.user', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ]);

  const monthlyStats = await Match.aggregate([
    {
      $match: {
        'players.user': userId,
        date: { $gte: startOfYear }
      }
    },
    {
      $group: {
        _id: { $month: '$date' },
        totalGames: { $sum: 1 },
        wins: {
          $sum: {
            $cond: [
              {
                $in: [
                  userId,
                  {
                    $map: {
                      input: {
                        $filter: { input: '$players', cond: '$$this.isWinner' }
                      },
                      as: 'winner',
                      in: '$$winner.user'
                    }
                  }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    totalMatches,
    matchesThisMonth,
    uniqueGamesThisMonth: uniqueGamesThisMonth.length,
    winRate: totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0,
    wins,
    mostPlayedGame: mostPlayedGame[0] || null,
    mostPlayedWithFriend: mostPlayedWithFriend[0] || null,
    monthlyStats
  };
};

