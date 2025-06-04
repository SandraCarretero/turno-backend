const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const uploadAvatarMiddleware = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(authenticate);

router.put('/profile', userController.updateProfile);
router.post('/avatar', uploadAvatarMiddleware, userController.uploadAvatar);
router.delete('/profile', userController.deleteUser);
router.get('/search', userController.searchUsers);
router.post('/friends/:userId', userController.sendFriendRequest);
router.put('/friends/:userId/accept', userController.acceptFriendRequest);
router.get('/stats', userController.getUserStats);
router.get('/:userId', userController.getUserProfile);

module.exports = router;
