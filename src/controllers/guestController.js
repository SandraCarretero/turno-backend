const guestService = require('../services/guestService');
const {
  createUserGuestValidations,
  guestUserValidations
} = require('../validations/userValidations');

const guestController = {
  createGuest: [
    ...createUserGuestValidations,
    async (req, res) => {
      try {
        const { name, email, avatar, notes } = req.body;
        const createdBy = req.user._id;

        // Validación adicional
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          console.log('Name validation failed:', name);
          return res.status(400).json({
            success: false,
            message: 'Guest name is required and must be a non-empty string'
          });
        }

        // Validar email si se proporciona
        if (
          email &&
          email.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
          console.log('Email validation failed:', email);
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }

        console.log('Creating guest with validated data:', {
          name: name.trim(),
          email: email?.trim() || null,
          avatar,
          notes,
          createdBy
        });

        const guest = await guestService.createGuest(
          {
            name: name.trim(),
            email: email?.trim() || null,
            avatar: avatar || null,
            notes: notes || null
          },
          createdBy
        );

        console.log('Guest created successfully:', guest);

        res.status(201).json({
          success: true,
          guest,
          message: 'Guest created successfully'
        });
      } catch (error) {
        console.error('Create guest error:', error);

        // Manejar errores específicos de MongoDB
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'A guest with this name already exists'
          });
        }

        res.status(500).json({
          success: false,
          message: 'Server error',
          error:
            process.env.NODE_ENV === 'development'
              ? error.message
              : 'Internal server error'
        });
      }
    }
  ],

  getGuests: async (req, res) => {
    try {
      console.log('Getting guests for user:', req.user._id);
      const guests = await guestService.getGuests(req.user._id);

      res.json({
        success: true,
        guests
      });
    } catch (error) {
      console.error('Get guests error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  searchGuests: async (req, res) => {
    try {
      const { q } = req.query;
      console.log('Searching guests with query:', q, 'for user:', req.user._id);
      const guests = await guestService.searchGuests(q, req.user._id);

      res.json({
        success: true,
        guests
      });
    } catch (error) {
      console.error('Search guests error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  getGuest: async (req, res) => {
    try {
      const { guestId } = req.params;
      const result = await guestService.getGuest(guestId, req.user._id);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Get guest error:', error);
      if (error.message === 'Guest not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  updateGuest: [
    ...guestUserValidations,
    async (req, res) => {
      try {
        const { guestId } = req.params;
        const updateData = req.body;

        const guest = await guestService.updateGuest(
          guestId,
          updateData,
          req.user._id
        );

        res.json({
          success: true,
          guest,
          message: 'Guest updated successfully'
        });
      } catch (error) {
        console.error('Update guest error:', error);
        if (error.message === 'Guest not found') {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  ],

  deleteGuest: async (req, res) => {
    try {
      const { guestId } = req.params;

      await guestService.deleteGuest(guestId, req.user._id);

      res.json({
        success: true,
        message: 'Guest deleted successfully'
      });
    } catch (error) {
      console.error('Delete guest error:', error);
      if (
        error.message.includes('not found') ||
        error.message.includes('associated matches')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  syncGuest: async (req, res) => {
    try {
      const { guestId } = req.params;
      const { targetUserId } = req.body;

      console.log(`Sync request: guest ${guestId} -> user ${targetUserId}`);

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'Target user ID is required'
        });
      }

      const result = await guestService.syncGuest(
        guestId,
        req.user._id,
        targetUserId
      );

      console.log(`Sync result:`, result);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Sync guest error:', error);
      if (
        error.message.includes('not found') ||
        error.message.includes('already synced')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};

module.exports = guestController;
