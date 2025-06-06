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

  // Estadísticas básicas (las que ya tienes)
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

  // NUEVA LÓGICA: Encontrar el compañero con quien más has jugado
  const partnerStats = await Match.aggregate([
    {
      // Filtrar partidas donde el usuario participó
      $match: {
        'players.user': userId
      }
    },
    {
      // Desenrollar el array de jugadores
      $unwind: '$players'
    },
    {
      // Filtrar para excluir al usuario actual y obtener solo otros jugadores
      $match: {
        'players.user': { $ne: userId }
      }
    },
    {
      // Agrupar por usuario compañero y contar partidas
      $group: {
        _id: '$players.user',
        count: { $sum: 1 },
        playerInfo: { $first: '$players' }
      }
    },
    {
      // Ordenar por cantidad de partidas (descendente)
      $sort: { count: -1 }
    },
    {
      // Tomar solo el primero (el que más partidas tiene)
      $limit: 1
    },
    {
      // Hacer lookup para obtener información del usuario
      $lookup: {
        from: 'users', // Asume que tu colección de usuarios se llama 'users'
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    {
      // Formatear el resultado
      $project: {
        _id: 1,
        count: 1,
        name: { $arrayElemAt: ['$userDetails.name', 0] },
        username: { $arrayElemAt: ['$userDetails.username', 0] },
        email: { $arrayElemAt: ['$userDetails.email', 0] }
      }
    }
  ]);

  // NUEVA LÓGICA: Encontrar el juego más jugado
  const mostPlayedGameStats = await Match.aggregate([
    {
      $match: {
        'players.user': userId
      }
    },
    {
      $group: {
        _id: '$game.bggId',
        count: { $sum: 1 },
        gameInfo: { $first: '$game' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 1
    },
    {
      $project: {
        _id: 1,
        count: 1,
        game: '$gameInfo'
      }
    }
  ]);

  // NUEVA LÓGICA: Estadísticas mensuales para los últimos 6 meses
  const monthlyStats = await Match.aggregate([
    {
      $match: {
        'players.user': userId,
        date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Calcular tasa de victoria
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  // Construir el objeto de respuesta
  const statsResponse = {
    totalMatches,
    wins,
    winRate: Math.round(winRate * 10) / 10, // Redondear a 1 decimal
    matchesThisMonth,
    uniqueGamesThisMonth: uniqueGamesThisMonth.length,
    mostPlayedWithFriend: partnerStats.length > 0 ? partnerStats[0] : null,
    mostPlayedGame:
      mostPlayedGameStats.length > 0 ? mostPlayedGameStats[0] : null,
    monthlyStats: monthlyStats
  };

  return statsResponse;
};
