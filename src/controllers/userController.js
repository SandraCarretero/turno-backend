const userService = require('../services/userService');
const { createNotification } = require('../services/notificationService');
const User = require('../models/userModel');
const Match = require('../models/matchModel');
const { cloudinary } = require('../config/cloudinary');

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
      console.log('=== UPLOAD AVATAR CONTROLLER ===');
      console.log('User:', req.user._id);
      console.log('File:', req.file);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha subido ningún archivo'
        });
      }

      const avatarUrl = req.file.path;
      console.log('Avatar URL from Cloudinary:', avatarUrl);

      // Buscar el usuario actual
      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Eliminar avatar anterior si existe
      if (currentUser.avatar && currentUser.avatar.includes('cloudinary')) {
        try {
          const urlParts = currentUser.avatar.split('/');
          const publicIdWithExtension = urlParts
            .slice(urlParts.indexOf('turno-app'))
            .join('/');
          const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

          console.log('Deleting previous avatar with publicId:', publicId);
          await cloudinary.uploader.destroy(publicId);
          console.log('Previous avatar deleted from Cloudinary');
        } catch (cloudinaryError) {
          console.error(
            'Error deleting previous avatar from Cloudinary:',
            cloudinaryError
          );
          // No retornamos error aquí, solo loggeamos
        }
      }

      // Actualizar usuario con nueva URL del avatar
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

      console.log('Avatar updated successfully for user:', user._id);

      res.json({
        success: true,
        avatar: user.avatar,
        message: 'Avatar actualizado correctamente'
      });
    } catch (error) {
      console.error('Error completo al subir avatar:', error);

      // Si hay un archivo subido y ocurre un error, intentar eliminarlo
      if (req.file && req.file.public_id) {
        try {
          await cloudinary.uploader.destroy(req.file.public_id);
          console.log('Uploaded file deleted from Cloudinary due to error');
        } catch (cloudinaryError) {
          console.error(
            'Error deleting file from Cloudinary:',
            cloudinaryError
          );
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error del servidor al actualizar el avatar',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error'
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

      const existingFriend = targetUser.friends.find(
        friend => friend.user.toString() === currentUserId.toString()
      );

      if (existingFriend) {
        return res.status(400).json({
          message: 'Friend request already exists or already friends'
        });
      }

      targetUser.friends.push({
        user: currentUserId,
        status: 'pending'
      });
      await targetUser.save();

      const notification = await createNotification({
        recipient: userId,
        sender: currentUserId,
        type: 'friend_request',
        message: `${req.user.username} sent you a friend request`
      });

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

      const senderUser = await User.findById(userId);
      senderUser.friends.push({
        user: currentUserId,
        status: 'accepted'
      });
      await senderUser.save();

      const notification = await createNotification({
        recipient: userId,
        sender: currentUserId,
        type: 'friend_accepted',
        message: `${req.user.username} accepted your friend request`
      });

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
