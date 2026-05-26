import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"


export const sendNotification = async ({
  userIds = [],
  roles = [],
  message,
  meta = {}
}) => {
  let recipients = [];

  if (userIds.length) {
    recipients = [...userIds];
  }

  if (roles.length) {
    const roleUsers = await User.find({ role: { $in: roles } }).select('_id');
    recipients.push(...roleUsers.map(u => u._id));
  }

  recipients = [...new Set(recipients.map(id => id.toString()))];

  const notifications = recipients.map(userId => ({
    userId,
    message,
    meta
  }));

  return Notification.insertMany(notifications);
};