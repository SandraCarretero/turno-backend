const express = require('express');
const gameController = require('../controllers/gameController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/search', gameController.searchGames);
router.get('/popular', authenticate, gameController.getHotGames);
router.get('/bestsellers', authenticate, gameController.getBestsellers);
router.get('/:gameId', authenticate, gameController.getGameDetails);
router.post('/collection', authenticate, gameController.addGameToCollection);
router.delete('/collection/:gameId', authenticate, gameController.removeGameFromCollection);

module.exports = router;

