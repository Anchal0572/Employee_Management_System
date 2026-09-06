const { Notification, User } = require('../models');
const { getDbStatus } = require('../config/db');

const INITIAL_SEED_NOTIFICATIONS = [
  {
    _id: '66e3a0000000000000000001',
    recipientRole: 'admin',
    title: 'New Leave Request',
    message: 'Sophia Chen submitted an Earned leave request (2 days).',
    type: 'leave',
    link: '/leaves',
    read: false,
    createdAt: new Date('2025-05-15T09:30:00.000Z')
  },
  {
    _id: '66e3a0000000000000000002',
    recipientRole: 'all',
    title: 'Upcoming Corporate Holiday',
    message: 'Memorial Day observance on May 26, 2025. Offices closed.',
    type: 'system',
    link: '/attendance',
    read: false,
    createdAt: new Date('2025-05-14T12:00:00.000Z')
  },
  {
    _id: '66e3a0000000000000000003',
    recipientRole: 'employee',
    title: 'Timesheet Verified',
    message: 'Your shift for May 14 has been reconciled with 8.5 hours.',
    type: 'attendance',
    link: '/attendance',
    read: true,
    createdAt: new Date('2025-05-14T18:30:00.000Z')
  }
];

class DevMemoryNotificationStore {
  constructor() {
    this.notifications = new Map();
    INITIAL_SEED_NOTIFICATIONS.forEach((n) => {
      this.notifications.set(n._id, { ...n });
    });
  }

  getAll() {
    return Array.from(this.notifications.values());
  }

  create(data) {
    const _id = `66e3a00000000000000000${(this.notifications.size + 10).toString().padStart(2, '0')}`;
    const newNotif = {
      _id,
      ...data,
      read: false,
      createdAt: new Date()
    };
    this.notifications.set(_id, newNotif);
    return newNotif;
  }

  markRead(id) {
    const notif = this.notifications.get(id);
    if (notif) {
      notif.read = true;
      return notif;
    }
    return null;
  }

  markAllRead(role) {
    for (const notif of this.notifications.values()) {
      if (!role || notif.recipientRole === role || notif.recipientRole === 'all') {
        notif.read = true;
      }
    }
    return true;
  }
}

const devNotificationStore = new DevMemoryNotificationStore();

class NotificationService {
  /**
   * Create an in-app notification
   */
  async createNotification(data) {
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      return await Notification.create({
        recipient: data.recipient || null,
        recipientRole: data.recipientRole || 'all',
        recipientEmail: data.recipientEmail || '',
        title: data.title,
        message: data.message,
        type: data.type || 'system',
        link: data.link || '/notifications',
        read: false
      });
    } else {
      return devNotificationStore.create(data);
    }
  }

  /**
   * Get notifications for the authenticated user
   */
  async getUserNotifications(user, query = {}) {
    const isDbConnected = getDbStatus().isConnected;
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    if (isDbConnected) {
      const filter = {
        $or: [
          { recipient: user._id || user.id },
          { recipientRole: user.role },
          { recipientRole: 'all' }
        ]
      };

      if (query.type && query.type !== 'all') {
        filter.type = query.type;
      }
      if (query.unreadOnly === 'true') {
        filter.read = false;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Notification.countDocuments(filter)
      ]);

      const unreadCount = await Notification.countDocuments({ ...filter, read: false });

      return {
        notifications,
        unreadCount,
        pagination: { total, totalPages: Math.ceil(total / limit) || 1, page, limit }
      };
    } else {
      let list = devNotificationStore.getAll().filter(
        (n) => n.recipientRole === user.role || n.recipientRole === 'all' || (user._id && n.recipient === user._id)
      );

      if (query.type && query.type !== 'all') {
        list = list.filter((n) => n.type === query.type);
      }
      if (query.unreadOnly === 'true') {
        list = list.filter((n) => !n.read);
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const unreadCount = list.filter((n) => !n.read).length;
      const total = list.length;
      const paginated = list.slice(skip, skip + limit);

      return {
        notifications: paginated,
        unreadCount,
        pagination: { total, totalPages: Math.ceil(total / limit) || 1, page, limit }
      };
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(id) {
    const isDbConnected = getDbStatus().isConnected;
    if (isDbConnected) {
      return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    } else {
      return devNotificationStore.markRead(id);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(user) {
    const isDbConnected = getDbStatus().isConnected;
    if (isDbConnected) {
      await Notification.updateMany(
        {
          $or: [
            { recipient: user._id || user.id },
            { recipientRole: user.role },
            { recipientRole: 'all' }
          ]
        },
        { read: true }
      );
      return { success: true };
    } else {
      devNotificationStore.markAllRead(user.role);
      return { success: true };
    }
  }
}

module.exports = new NotificationService();
