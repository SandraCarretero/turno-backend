const User = require('../models/userModel');
const Match = require('../models/matchModel');
const mongoose = require('mongoose');

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

// exports.getUserStats = async userId => {
//   const now = new Date();
//   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//   const startOfYear = new Date(now.getFullYear(), 0, 1);

//   const totalMatches = await Match.countDocuments({
//     'players.user': userId
//   });

//   const matchesThisMonth = await Match.countDocuments({
//     'players.user': userId,
//     date: { $gte: startOfMonth }
//   });

//   const uniqueGamesThisMonth = await Match.distinct('game.bggId', {
//     'players.user': userId,
//     date: { $gte: startOfMonth }
//   });

//   const wins = await Match.countDocuments({
//     'players.user': userId,
//     'players.isWinner': true,
//     $expr: {
//       $in: [
//         userId,
//         {
//           $map: {
//             input: { $filter: { input: '$players', cond: '$$this.isWinner' } },
//             as: 'winner',
//             in: '$$winner.user'
//           }
//         }
//       ]
//     }
//   });

//   const mostPlayedGame = await Match.aggregate([
//     { $match: { 'players.user': userId } },
//     {
//       $group: {
//         _id: '$game.bggId',
//         count: { $sum: 1 },
//         game: { $first: '$game' }
//       }
//     },
//     { $sort: { count: -1 } },
//     { $limit: 1 }
//   ]);

//   const mostPlayedWithFriend = await Match.aggregate([
//     { $match: { 'players.user': userId } },
//     { $unwind: '$players' },
//     { $match: { 'players.user': { $ne: userId } } },
//     { $group: { _id: '$players.user', count: { $sum: 1 } } },
//     { $sort: { count: -1 } },
//     { $limit: 1 },
//     {
//       $lookup: {
//         from: 'users',
//         localField: '_id',
//         foreignField: '_id',
//         as: 'user'
//       }
//     },
//     { $unwind: '$user' }
//   ]);

//   const monthlyStats = await Match.aggregate([
//     {
//       $match: {
//         'players.user': userId,
//         date: { $gte: startOfYear }
//       }
//     },
//     {
//       $group: {
//         _id: { $month: '$date' },
//         totalGames: { $sum: 1 },
//         wins: {
//           $sum: {
//             $cond: [
//               {
//                 $in: [
//                   userId,
//                   {
//                     $map: {
//                       input: {
//                         $filter: { input: '$players', cond: '$$this.isWinner' }
//                       },
//                       as: 'winner',
//                       in: '$$winner.user'
//                     }
//                   }
//                 ]
//               },
//               1,
//               0
//             ]
//           }
//         }
//       }
//     },
//     { $sort: { _id: 1 } }
//   ]);

//   return {
//     totalMatches,
//     matchesThisMonth,
//     uniqueGamesThisMonth: uniqueGamesThisMonth.length,
//     winRate: totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0,
//     wins,
//     mostPlayedGame: mostPlayedGame[0] || null,
//     mostPlayedWithFriend: mostPlayedWithFriend[0] || null,
//     monthlyStats
//   };
// };

exports.getUserStats = async userId => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Convertir userId a ObjectId de forma segura
    let userObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } else {
        userObjectId = userId;
      }
    } catch (error) {
      console.error('❌ Error creating ObjectId:', error);
      throw new Error('Invalid user ID format');
    }

    // 1. Total matches
    const totalMatches = await Match.countDocuments({
      'players.user': userObjectId
    });

    // 2. Matches this month
    const matchesThisMonth = await Match.countDocuments({
      'players.user': userObjectId,
      date: { $gte: startOfMonth }
    });

    // 3. Unique games this month
    const uniqueGamesThisMonth = await Match.distinct('game.bggId', {
      'players.user': userObjectId,
      date: { $gte: startOfMonth }
    });

    // 4. Wins calculation - versión simplificada
    let wins = 0;
    try {
      const winningMatches = await Match.find({
        'players.user': userObjectId,
        'players.isWinner': true
      });

      wins = winningMatches.filter(match =>
        match.players.some(
          player =>
            player.user.toString() === userObjectId.toString() &&
            player.isWinner
        )
      ).length;
    } catch (error) {
      console.error('❌ Error calculating wins:', error);
      wins = 0;
    }

    // 5. Most played game
    let mostPlayedGame = null;
    try {
      const mostPlayedGameResult = await Match.aggregate([
        { $match: { 'players.user': userObjectId } },
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
      mostPlayedGame = mostPlayedGameResult[0] || null;
    } catch (error) {
      console.error('❌ Error calculating most played game:', error);
      mostPlayedGame = null;
    }

    // 6. Most played with friend - MÉTODO SIMPLIFICADO
    let mostPlayedWithFriend = null;

    try {
      // Obtener todas las partidas del usuario con múltiples jugadores
      const multiPlayerMatches = await Match.find({
        'players.user': userObjectId,
        'players.1': { $exists: true } // Asegurar que hay al menos 2 jugadores
      }).populate('players.user', 'username email name avatar');

      if (multiPlayerMatches.length > 0) {
        // Contar compañeros
        const companionCounts = {};

        multiPlayerMatches.forEach(match => {
          match.players.forEach(player => {
            if (
              player.user &&
              player.user._id.toString() !== userObjectId.toString()
            ) {
              const companionId = player.user._id.toString();
              if (!companionCounts[companionId]) {
                companionCounts[companionId] = {
                  count: 0,
                  user: player.user
                };
              }
              companionCounts[companionId].count++;
            }
          });
        });
        console.log(companionCounts);

        // Encontrar el compañero más frecuente
        if (Object.keys(companionCounts).length > 0) {
          const topCompanion = Object.values(companionCounts).reduce(
            (max, current) => (current.count > max.count ? current : max)
          );
          mostPlayedWithFriend = {
            count: topCompanion.count,
            _id: topCompanion.user._id,
            username: topCompanion.user.username,
            email: topCompanion.user.email,
            name: topCompanion.user.name,
            avatar: topCompanion.user.avatar
          };
        }
      }
    } catch (error) {
      console.error('❌ Error calculating most played with friend:', error);
      mostPlayedWithFriend = null;
    }

    // 7. Monthly stats - versión simplificada
    let monthlyStats = [];
    try {
      const monthlyStatsResult = await Match.aggregate([
        {
          $match: {
            'players.user': userObjectId,
            date: { $gte: startOfYear }
          }
        },
        {
          $group: {
            _id: { $month: '$date' },
            totalGames: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      monthlyStats = monthlyStatsResult;
    } catch (error) {
      console.error('❌ Error calculating monthly stats:', error);
      monthlyStats = [];
    }

    const result = {
      totalMatches,
      matchesThisMonth,
      uniqueGamesThisMonth: uniqueGamesThisMonth.length,
      winRate: totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0,
      wins,
      mostPlayedGame,
      mostPlayedWithFriend,
      monthlyStats
    };

    return result;
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in getUserStats:', error);
    console.error('Stack trace:', error.stack);

    // Retornar datos por defecto en caso de error crítico
    return {
      totalMatches: 0,
      matchesThisMonth: 0,
      uniqueGamesThisMonth: 0,
      winRate: 0,
      wins: 0,
      mostPlayedGame: null,
      mostPlayedWithFriend: null,
      monthlyStats: []
    };
  }
};
