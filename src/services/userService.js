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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Convertir userId a ObjectId si viene como string
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const totalMatches = await Match.countDocuments({
    'players.user': userObjectId
  });

  const matchesThisMonth = await Match.countDocuments({
    'players.user': userObjectId,
    date: { $gte: startOfMonth }
  });

  const uniqueGamesThisMonth = await Match.distinct('game.bggId', {
    'players.user': userObjectId,
    date: { $gte: startOfMonth }
  });

  const wins = await Match.countDocuments({
    'players.user': userObjectId,
    'players.isWinner': true,
    $expr: {
      $in: [
        userObjectId,
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

  // CORRECCIÓN PRINCIPAL: Agregado mejorado para mostPlayedWithFriend
  const mostPlayedWithFriend = await Match.aggregate([
    // 1. Filtrar partidas donde el usuario actual participó
    {
      $match: {
        'players.user': userObjectId,
        // Asegurar que hay al menos 2 jugadores
        $expr: { $gte: [{ $size: '$players' }, 2] }
      }
    },

    // 2. Desenrollar el array de jugadores
    { $unwind: '$players' },

    // 3. Filtrar para excluir al usuario actual
    {
      $match: {
        'players.user': { $ne: userObjectId }
      }
    },

    // 4. Agrupar por usuario y contar partidas
    {
      $group: {
        _id: '$players.user',
        count: { $sum: 1 }
      }
    },

    // 5. Ordenar por cantidad de partidas (descendente)
    { $sort: { count: -1 } },

    // 6. Tomar solo el primero
    { $limit: 1 },

    // 7. Hacer lookup para obtener información del usuario
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },

    // 8. Desenrollar el resultado del lookup
    { $unwind: '$userInfo' },

    // 9. Proyectar los campos necesarios
    {
      $project: {
        count: 1,
        _id: '$userInfo._id',
        name: '$userInfo.name',
        username: '$userInfo.username',
        email: '$userInfo.email',
        avatar: '$userInfo.avatar'
      }
    }
  ]);

  const monthlyStats = await Match.aggregate([
    {
      $match: {
        'players.user': userObjectId,
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
                  userObjectId,
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

  // Asegurar que el resultado sea válido
  const partnerResult =
    mostPlayedWithFriend.length > 0 ? mostPlayedWithFriend[0] : null;

  console.log('🔍 MostPlayedWithFriend query result:', partnerResult);

  return {
    totalMatches,
    matchesThisMonth,
    uniqueGamesThisMonth: uniqueGamesThisMonth.length,
    winRate: totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0,
    wins,
    mostPlayedGame: mostPlayedGame[0] || null,
    mostPlayedWithFriend: partnerResult,
    monthlyStats
  };
};
