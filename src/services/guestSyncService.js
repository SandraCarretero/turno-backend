const Match = require('../models/matchModel');

/**
 * Busca partidas donde un usuario participó como invitado y las sincroniza
 * @param {string} userId - ID del usuario registrado
 * @param {string} email - Email del usuario (para buscar coincidencias)
 * @param {string} username - Username del usuario (para buscar coincidencias)
 */

exports.autoSyncOnRegistration = async (userId, email, username) => {
  try {
    // Buscar partidas donde el usuario pudo haber participado como invitado
    // Buscamos por nombre de invitado que coincida con username o email
    const potentialMatches = await Match.find({
      'players.user': null, // Solo jugadores invitados
      $or: [
        { 'players.guestName': { $regex: new RegExp(`^${username}$`, 'i') } },
        { 'players.guestName': { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    let syncedMatches = 0;
    let syncedPlayers = 0;

    for (const match of potentialMatches) {
      let matchUpdated = false;

      for (const player of match.players) {
        // Si es un invitado y su nombre coincide con el usuario
        if (
          !player.user &&
          player.guestName &&
          (player.guestName.toLowerCase() === username.toLowerCase() ||
            player.guestName.toLowerCase() === email.toLowerCase())
        ) {
          // Sincronizar el jugador invitado con el usuario registrado
          player.user = userId;
          // Mantener los datos del invitado por si acaso
          player.guestId = `synced_${Date.now()}`;

          matchUpdated = true;
          syncedPlayers++;
        }
      }

      if (matchUpdated) {
        await match.save();
        syncedMatches++;
      }
    }

    return {
      success: true,
      syncedMatches,
      syncedPlayers,
      message: `Synchronized ${syncedPlayers} guest entries across ${syncedMatches} matches`
    };
  } catch (error) {
    console.error('Error syncing guest matches:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Busca posibles coincidencias de invitados para un usuario
 * @param {string} email - Email del usuario
 * @param {string} username - Username del usuario
 */
exports.findGuestMatches = async (email, username) => {
  try {
    const potentialMatches = await Match.find({
      'players.user': null,
      $or: [
        { 'players.guestName': { $regex: new RegExp(`^${username}$`, 'i') } },
        { 'players.guestName': { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    })
      .populate('creator', 'username avatar')
      .populate('players.user', 'username avatar')
      .sort({ date: -1 });

    const matchesWithGuestData = potentialMatches
      .map(match => {
        const guestPlayers = match.players.filter(
          player =>
            !player.user &&
            player.guestName &&
            (player.guestName.toLowerCase() === username.toLowerCase() ||
              player.guestName.toLowerCase() === email.toLowerCase())
        );

        return {
          matchId: match._id,
          game: match.game,
          date: match.date,
          creator: match.creator,
          guestPlayers: guestPlayers.map(player => ({
            guestName: player.guestName,
            score: player.score,
            isWinner: player.isWinner
          }))
        };
      })
      .filter(match => match.guestPlayers.length > 0);

    return {
      success: true,
      matches: matchesWithGuestData,
      totalMatches: matchesWithGuestData.length,
      totalGuestEntries: matchesWithGuestData.reduce(
        (sum, match) => sum + match.guestPlayers.length,
        0
      )
    };
  } catch (error) {
    console.error('Error finding potential guest matches:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sincronización manual - permite al usuario confirmar qué partidas sincronizar
 * @param {string} userId - ID del usuario
 * @param {Array} matchIds - Array de IDs de partidas a sincronizar
 * @param {string} guestName - Nombre del invitado a sincronizar
 */

exports.manualSync = async (userId, matchIds, guestName) => {
  try {
    let syncedMatches = 0;
    let syncedPlayers = 0;

    for (const matchId of matchIds) {
      const match = await Match.findById(matchId);
      if (!match) continue;

      let matchUpdated = false;

      for (const player of match.players) {
        if (
          !player.user &&
          player.guestName &&
          player.guestName.toLowerCase() === guestName.toLowerCase()
        ) {
          player.user = userId;
          player.guestId = `manual_sync_${Date.now()}`;

          matchUpdated = true;
          syncedPlayers++;
        }
      }

      if (matchUpdated) {
        await match.save();
        syncedMatches++;
      }
    }

    return {
      success: true,
      syncedMatches,
      syncedPlayers
    };
  } catch (error) {
    console.error('Error in manual sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
