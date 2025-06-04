const userService = require('../services/userService');
const { createNotification } = require('../services/notificationService');
const User = require('../models/userModel');
const Match = require('../models/matchModel');
const fs = require('fs');

const { updateUserValidations } = require('../validations/userValidations');

const userController = {
  updateProfile: [
    ...updateUserValidations,
    async (req, res) => {
      try {
        const { username, email } = req.body;
        const userId = req.user._id;

        const user = await userService.updateProfile(userId, {
          username,
          email
        });
        res.json(user);
      } catch (error) {
        console.error('Update profile error:', error);
        if (error.message.includes('already exists')) {
          return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
      }
    }
  ],

  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha subido ningún archivo'
        });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarUrl },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        avatar: user.avatar,
        message: 'Avatar actualizado correctamente'
      });
    } catch (error) {
      console.error('Error al subir avatar:', error);

      // Elimina el archivo subido si hubo un error
      if (req.file) {
        await fs.promises.unlink(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error del servidor al actualizar el avatar',
        error: error.message
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.user._id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  searchUsers: async (req, res) => {
    try {
      const { q } = req.query;
      const users = await userService.searchUsers(q, req.user._id);
      res.json(users || []);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  sendFriendRequest: async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      if (userId === currentUserId.toString()) {
        return res
          .status(400)
          .json({ message: 'Cannot send friend request to yourself' });
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if already friends or request exists
      const existingFriend = targetUser.friends.find(
        friend => friend.user.toString() === currentUserId.toString()
      );

      if (existingFriend) {
        return res.status(400).json({
          message: 'Friend request already exists or already friends'
        });
      }

      // Add friend request
      targetUser.friends.push({
        user: currentUserId,
        status: 'pending'
      });
      await targetUser.save();

      // Create notification
      const notification = await createNotification({
        recipient: userId,
        sender: currentUserId,
        type: 'friend_request',
        message: `${req.user.username} sent you a friend request`
      });

      // Send real-time notification
      const io = req.app.get('io');
      io.to(`user_${userId}`).emit('notification', {
        type: 'friend_request',
        message: notification.message,
        sender: {
          id: req.user._id,
          username: req.user.username,
          avatar: req.user.avatar
        }
      });

      res.json({ message: 'Friend request sent' });
    } catch (error) {
      console.error('Send friend request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  acceptFriendRequest: async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      // Update current user's friends list
      const currentUser = await User.findById(currentUserId);
      const friendRequest = currentUser.friends.find(
        friend =>
          friend.user.toString() === userId && friend.status === 'pending'
      );

      if (!friendRequest) {
        return res.status(404).json({ message: 'Friend request not found' });
      }

      friendRequest.status = 'accepted';
      await currentUser.save();

      // Add current user to sender's friends list
      const senderUser = await User.findById(userId);
      senderUser.friends.push({
        user: currentUserId,
        status: 'accepted'
      });
      await senderUser.save();

      // Create notification
      const notification = await createNotification({
        recipient: userId,
        sender: currentUserId,
        type: 'friend_accepted',
        message: `${req.user.username} accepted your friend request`
      });

      // Send real-time notification
      const io = req.app.get('io');
      io.to(`user_${userId}`).emit('notification', {
        type: 'friend_accepted',
        message: notification.message,
        sender: {
          id: req.user._id,
          username: req.user.username,
          avatar: req.user.avatar
        }
      });

      res.json({ message: 'Friend request accepted' });
    } catch (error) {
      console.error('Accept friend request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getUserStats: async (req, res) => {
    try {
      const stats = await userService.getUserStats(req.user._id);
      res.json(stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getUserProfile: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password -emailVerificationToken')
        .populate('friends.user', 'username avatar');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's matches
      const matches = await Match.find({ 'players.user': userId })
        .populate('creator', 'username avatar')
        .populate('players.user', 'username avatar')
        .sort({ date: -1 })
        .limit(10);

      res.json({
        user,
        matches
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = userController;
