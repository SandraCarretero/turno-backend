const express = require('express');
const guestSyncController = require('../controllers/guestSyncController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/auto-sync', guestSyncController.autoSyncOnRegistration);
router.get('/find-matches', authenticate, guestSyncController.findGuestMatches);
router.post('/manual-sync', authenticate, guestSyncController.manualSync);

module.exports = router;
