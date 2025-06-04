const express = require('express');
const guestController = require('../controllers/guestController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', guestController.createGuest);
router.get('/', guestController.getGuests);
router.get('/search', guestController.searchGuests);
router.get('/:guestId', guestController.getGuest);
router.put('/:guestId', guestController.updateGuest);
router.delete('/:guestId', guestController.deleteGuest);
router.post('/:guestId/sync', guestController.syncGuest);

module.exports = router;

