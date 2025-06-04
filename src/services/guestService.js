const Match = require('../models/matchModel');
const Guest = require('../models/guestModel');


exports.createGuest = async (guestData, createdBy) => {
  const guest = new Guest({
    ...guestData,
    createdBy
  });

  await guest.save();
  return guest;
};

exports.getGuests = async userId => {
  const guests = await Guest.find({ createdBy: userId })
    .populate('syncedWith', 'username avatar')
    .sort({ name: 1 });

  return guests;
};

exports.searchGuests = async (query, userId) => {
  if (!query || query.length < 2) {
    return [];
  }

  const regex = new RegExp(query, 'i');

  const guests = await Guest.find({
    createdBy: userId,
    name: regex,
    syncedWith: null // Solo invitados no sincronizados
  })
    .select('_id name email avatar totalMatches totalWins')
    .limit(10);

  return guests;
};

exports.getGuest = async (guestId, userId) => {
  const guest = await Guest.findOne({
    _id: guestId,
    createdBy: userId
  }).populate('syncedWith', 'username avatar email');

  if (!guest) {
    throw new Error('Guest not found');
  }

  const matches = await Match.find({ 'players.guest': guestId })
    .populate('game')
    .populate('creator', 'username avatar')
    .sort({ date: -1 });

  const stats = {
    totalMatches: matches.length,
    totalWins: matches.reduce((wins, match) => {
      const guestPlayer = match.players.find(
        p => p.guest?.toString() === guestId
      );
      return wins + (guestPlayer?.isWinner ? 1 : 0);
    }, 0),
    winRate:
      matches.length > 0
        ? (
            (matches.reduce((wins, match) => {
              const guestPlayer = match.players.find(
                p => p.guest?.toString() === guestId
              );
              return wins + (guestPlayer?.isWinner ? 1 : 0);
            }, 0) /
              matches.length) *
            100
          ).toFixed(1)
        : 0,
    recentMatches: matches.slice(0, 5)
  };

  return {
    guest,
    stats,
    matches: matches.slice(0, 10)
  };
};

exports.updateGuest = async (guestId, updateData, userId) => {
  const guest = await Guest.findOneAndUpdate(
    { _id: guestId, createdBy: userId },
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  if (!guest) {
    throw new Error('Guest not found');
  }

  return guest;
};

exports.deleteGuest = async (guestId, userId) => {
  // Verificar que no tenga partidas asociadas
  const matchCount = await Match.countDocuments({ 'players.guest': guestId });

  if (matchCount > 0) {
    throw new Error('Cannot delete guest with associated matches');
  }

  const guest = await Guest.findOneAndDelete({
    _id: guestId,
    createdBy: userId
  });

  if (!guest) {
    throw new Error('Guest not found');
  }

  return guest;
};

exports.syncGuest = async (guestId, userId, targetUserId) => {
  const guest = await Guest.findOne({
    _id: guestId,
    createdBy: userId
  });

  if (!guest) {
    throw new Error('Guest not found');
  }

  if (guest.syncedWith) {
    throw new Error('Guest is already synced with a user');
  }

  // Buscar partidas donde aparece este invitado - buscar por múltiples criterios
  const matches = await Match.find({
    $or: [
      { 'players.guest': guestId }, // Invitados persistentes
      {
        'players.guestName': guest.name,
        'players.user': null
      } // Invitados temporales con el mismo nombre
    ]
  });

  let updatedMatches = 0;
  for (const match of matches) {
    let matchUpdated = false;

    for (const player of match.players) {
      // Sincronizar si es el invitado persistente O si es un invitado temporal con el mismo nombre
      if (
        player.guest?.toString() === guestId ||
        (!player.user && player.guestName === guest.name)
      ) {
        player.user = targetUserId;
        // Mantener la referencia al guest para historial
        if (!player.guest) {
          player.guest = guestId;
        }
        matchUpdated = true;
      }
    }

    if (matchUpdated) {
      await match.save();
      updatedMatches++;
      console.log(`Updated match ${match._id}`);
    }
  }

  // Marcar el invitado como sincronizado
  guest.syncedWith = targetUserId;
  guest.syncedAt = new Date();
  await guest.save();

  console.log(`Sync completed: ${updatedMatches} matches updated`);

  return {
    guest,
    updatedMatches,
    message: `Guest "${guest.name}" synced with user. ${updatedMatches} matches updated.`
  };
};

exports.updateGuestStats = async guestId => {
  const matches = await Match.find({ 'players.guest': guestId });

  const totalMatches = matches.length;
  const totalWins = matches.reduce((wins, match) => {
    const guestPlayer = match.players.find(
      p => p.guest?.toString() === guestId
    );
    return wins + (guestPlayer?.isWinner ? 1 : 0);
  }, 0);

  await Guest.findByIdAndUpdate(guestId, {
    totalMatches,
    totalWins
  });

  return { totalMatches, totalWins };
};
