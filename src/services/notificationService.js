const Notification = require('../models/notificationModel');

exports.createNotification = async (notificationData) => {
  const notification = new Notification(notificationData)
  await notification.save()
  return notification
}

exports.getUserNotifications = async (userId, page = 1, limit = 20) => {
  const notifications = await Notification.find({
    recipient: userId,
  })
    .populate("sender", "username avatar")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  })

  return {
    notifications,
    unreadCount,
  }
}

exports.markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },
    { isRead: true },
    { new: true },
  )
}

exports.markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    { isRead: true },
  )
}
