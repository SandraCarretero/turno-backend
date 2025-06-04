const guestSyncService = require('../services/guestSyncService');

exports.autoSyncOnRegistration = async (req, res) => {
  try {
    const { userId, email, username } = req.body

    const result = await guestSyncService.autoSyncOnRegistration(userId, email, username)

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          syncedMatches: result.syncedMatches,
          syncedPlayers: result.syncedPlayers,
        },
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to sync guest matches",
        error: result.error,
      })
    }
  } catch (error) {
    console.error("Auto sync error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during sync",
    })
  }
}

exports.findGuestMatches = async (req, res) => {
  try {
    const { email, username } = req.user

    const result = await guestSyncService.findGuestMatches(email, username)

    if (result.success) {
      res.json({
        success: true,
        matches: result.matches,
        totalMatches: result.totalMatches,
        totalGuestEntries: result.totalGuestEntries,
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to find guest matches",
        error: result.error,
      })
    }
  } catch (error) {
    console.error("Find guest matches error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

exports.manualSync = async (req, res) => {
  try {
    const { matchIds, guestName } = req.body
    const userId = req.user._id

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Match IDs are required",
      })
    }

    if (!guestName) {
      return res.status(400).json({
        success: false,
        message: "Guest name is required",
      })
    }

    const result = await guestSyncService.manualSync(userId, matchIds, guestName)

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully synced ${result.syncedPlayers} guest entries across ${result.syncedMatches} matches`,
        data: {
          syncedMatches: result.syncedMatches,
          syncedPlayers: result.syncedPlayers,
        },
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to sync selected matches",
        error: result.error,
      })
    }
  } catch (error) {
    console.error("Manual sync error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during manual sync",
    })
  }
}
