const gameService = require('../services/gameService');
const User = require('../models/userModel');

exports.searchGames = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const games = await gameService.searchGames(q);

    const detailedGames = (
      await Promise.all(
        games.map(async game => {
          try {
            return await gameService.getGameDetails(game.bggId);
          } catch (error) {
            console.error(
              `Error fetching details for game ${game.bggId}:`,
              error
            );
            return null;
          }
        })
      )
    ).filter(game => game !== null);

    res.json(detailedGames);
  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({ message: 'Error searching games' });
  }
};

exports.getGameDetails = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await gameService.getGameDetails(gameId);
    res.json(game);
  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({ message: 'Error fetching game details' });
  }
};

exports.addGameToCollection = async (req, res) => {
  try {
    const { bggId, name, image, minPlayers, maxPlayers, playingTime } =
      req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    const existingGame = user.games.find(game => game.bggId === bggId);
    if (existingGame) {
      return res.status(400).json({ message: 'Game already in collection' });
    }

    user.games.push({
      bggId,
      name,
      image,
      minPlayers,
      maxPlayers,
      playingTime
    });

    await user.save();

    res.json({ message: 'Juego añadido a la colección' });
  } catch (error) {
    console.error('Add game to collection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeGameFromCollection = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    user.games = user.games.filter(game => game.bggId !== gameId);

    await user.save();

    res.json({ message: 'Juego eliminado de la colección' });
  } catch (error) {
    console.error('Remove game from collection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getHotGames = async (req, res) => {
  try {
    const popularGames = await gameService.getHotGames();
    res.json(popularGames);
  } catch (error) {
    console.error('Get popular games error:', error);
    res.status(500).json({ message: 'Error fetching popular games' });
  }
};

const bestsellerIds = [
  '174430', // Gloomhaven
  '13',     // Catan
  '68448',  // Pandemic
  '146306', // Azul
  '161936', // Terraforming Mars
  '220308', // Wingspan
  '1610',   // Carcassonne
  '1870',   // Scythe
  '12333',  // Dominion
  '205896', // Root
];

exports.getBestsellers = async (req, res) => {
  try {
    const bestsellers = await gameService.getBestsellers(bestsellerIds);
    res.json(bestsellers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching bestsellers' });
  }
};

