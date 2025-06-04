const express = require('express');
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', matchController.createMatch);
router.get('/', matchController.getUserMatches);
router.get('/game/:gameId', matchController.getMatchesByGame);
router.get('/:matchId', matchController.getMatch);
router.put('/:matchId', authenticate, matchController.updateMatch);
router.delete('/:matchId', authenticate, matchController.deleteMatch);

module.exports = router;
