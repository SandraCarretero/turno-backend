const matchService = require('../services/matchService');
const { createNotification } = require('../services/notificationService');

const matchValidations = require('../validations/matchValidations');

const matchController = {
  createMatch: [
    ...matchValidations,
    async (req, res) => {
      try {
        const {
          game,
          players,
          duration,
          date,
          location,
          notes,
          isTeamGame,
          isCooperative,
          hasWinner,
          status
        } = req.body;

        const matchData = {
          game,
          creator: req.user._id,
          players,
          duration,
          date,
          location,
          notes,
          isTeamGame,
          isCooperative,
          hasWinner,
          status
        };

        const match = await matchService.createMatch(matchData);

        const io = req.app.get('io');

        for (const player of players) {
          if (!player?.user) continue;

          if (player.user.toString() !== req.user._id.toString()) {
            const notification = await createNotification({
              recipient: player.user,
              sender: req.user._id,
              type: 'match_added',
              message: `${req.user.username} added you to a match: ${game.name}`,
              data: { matchId: match._id }
            });

            io.to(`user_${player.user}`).emit('notification', {
              type: 'match_added',
              message: notification.message,
              sender: {
                id: req.user._id,
                username: req.user.username,
                avatar: req.user.avatar
              },
              data: { matchId: match._id }
            });
          }
        }

        res.status(201).json(match);
      } catch (error) {
        console.error('Create match error:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  ],

  getUserMatches: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user._id;

      const result = await matchService.getUserMatches(userId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getMatch: async (req, res) => {
    try {
      const { matchId } = req.params;

      const match = await matchService.getMatch(matchId);

      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      const isParticipant = match.players.some(
        player => player.user._id.toString() === req.user._id.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(match);
    } catch (error) {
      console.error('Get match error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateMatch: async (req, res) => {
    try {
      const { matchId } = req.params;
      const updateData = req.body;

      const match = await matchService.getMatch(matchId);

      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      if (match.creator._id.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: 'Only the creator can edit this match' });
      }

      const updatedMatch = await matchService.updateMatch(matchId, updateData);
      res.json(updatedMatch);
    } catch (error) {
      console.error('Update match error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteMatch: async (req, res) => {
    try {
      const { matchId } = req.params;

      const match = await matchService.getMatch(matchId);

      console.log('match.creator:', match.creator);
      console.log('req.user._id:', req.user._id);
      console.log(
        'match.creator === req.user._id:',
        match.creator === req.user._id
      );

      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      if (match.creator._id.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: 'Only the creator can delete this match' });
      }

      await matchService.deleteMatch(matchId);
      res.json({ message: 'Match deleted successfully' });
    } catch (error) {
      console.error('Delete match error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getMatchesByGame: async (req, res) => {
    try {
      const { gameId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await matchService.getMatchesByGame(
        gameId,
        req.user._id,
        page,
        limit
      );
      res.json(result);
    } catch (error) {
      console.error('Get matches by game error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = matchController;
