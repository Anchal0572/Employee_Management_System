const { getDbStatus } = require('../config/db');
const Announcement = require('../models/Announcement');
const ApiError = require('../utils/apiError');

const INITIAL_ANNOUNCEMENTS = [
  {
    _id: '66e1f0000000000000000001',
    title: '🌟 Q1 All-Hands Global Townhall & Product Roadmap',
    content: 'Join CEO & Leadership for the 2026 vision presentation, new product launches, and employee Q&A session this Thursday at 3:00 PM EST via Zoom.',
    category: 'Townhall & Event',
    priority: 'High',
    pinned: true,
    authorName: 'Anchal Keshri',
    authorRole: 'VP of People Operations',
    department: 'All Departments',
    createdAt: new Date('2026-03-01')
  },
  {
    _id: '66e1f0000000000000000002',
    title: '🌿 New Hybrid Remote-Work & Home Setup Reimbursement Policy',
    content: 'We have updated our remote workplace stipend policy. Every employee is now entitled to a $200 quarterly allowance for high-speed internet and ergonomic workspace gear. Claims can be submitted directly via the Expense Reimbursements tab.',
    category: 'Policy Update',
    priority: 'Urgent',
    pinned: true,
    authorName: 'Marcus Vance',
    authorRole: 'Director of HR',
    department: 'All Departments',
    createdAt: new Date('2026-02-20')
  },
  {
    _id: '66e1f0000000000000000003',
    title: '🏆 Sophia Chen Celebrates 4 Years at WorkPulse!',
    content: 'Huge congratulations to Sophia Chen for reaching her 4th work anniversary as Staff Software Engineer! Thank you for your relentless dedication to building world-class distributed platforms.',
    category: 'Celebration',
    priority: 'Normal',
    pinned: false,
    authorName: 'Marcus Vance',
    authorRole: 'Director of HR',
    department: 'Engineering',
    createdAt: new Date('2026-03-03')
  },
  {
    _id: '66e1f0000000000000000004',
    title: '🏖️ Spring Holiday Notice: Office Closed on Good Friday',
    content: 'Please note that corporate offices and technical operations centers will remain closed for Good Friday on April 3, 2026. Standby emergency on-call rotations are published in PagerDuty.',
    category: 'Holiday & Off',
    priority: 'Normal',
    pinned: false,
    authorName: 'Anchal Keshri',
    authorRole: 'System Admin',
    department: 'All Departments',
    createdAt: new Date('2026-03-05')
  }
];

const COMPANY_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: "New Year's Day", day: 'Thursday', type: 'Public Holiday' },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day', day: 'Monday', type: 'Federal Holiday' },
  { date: '2026-04-03', name: 'Good Friday', day: 'Friday', type: 'Company Holiday' },
  { date: '2026-05-25', name: 'Memorial Day', day: 'Monday', type: 'Federal Holiday' },
  { date: '2026-07-03', name: 'Independence Day (Observed)', day: 'Friday', type: 'National Holiday' },
  { date: '2026-09-07', name: 'Labor Day', day: 'Monday', type: 'National Holiday' },
  { date: '2026-11-26', name: 'Thanksgiving Day', day: 'Thursday', type: 'National Holiday' },
  { date: '2026-11-27', name: 'Day After Thanksgiving', day: 'Friday', type: 'Company Holiday' },
  { date: '2026-12-25', name: 'Christmas Day', day: 'Friday', type: 'Public Holiday' }
];

const EMPLOYEE_CELEBRATIONS = [
  { employeeName: 'Sophia Chen', eventType: 'Work Anniversary (4 Years)', date: 'March 15', department: 'Engineering', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { employeeName: 'Marcus Vance', eventType: 'Birthday 🎂', date: 'March 22', department: 'HR', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { employeeName: 'Elena Rostova', eventType: 'Work Anniversary (2 Years)', date: 'April 02', department: 'Product Design', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' }
];

class AnnouncementMemoryStore {
  constructor() {
    this.announcements = new Map();
    INITIAL_ANNOUNCEMENTS.forEach((a) => this.announcements.set(a._id, { ...a }));
  }

  findAll({ category }) {
    let list = Array.from(this.announcements.values());
    if (category && category !== 'All') {
      list = list.filter((a) => a.category === category);
    }
    // Pinned announcements first, then descending date
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  create(data) {
    const newA = {
      _id: '66e1f0000000000' + (this.announcements.size + 1).toString().padStart(9, '0'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.announcements.set(newA._id, newA);
    return newA;
  }

  delete(id) {
    return this.announcements.delete(id);
  }
}

const devStore = new AnnouncementMemoryStore();

class AnnouncementService {
  async getAnnouncements({ category }) {
    const isDbConnected = getDbStatus().isConnected;

    if (!isDbConnected) {
      return {
        announcements: devStore.findAll({ category }),
        holidays: COMPANY_HOLIDAYS_2026,
        celebrations: EMPLOYEE_CELEBRATIONS
      };
    }

    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    const announcements = await Announcement.find(filter).sort({ pinned: -1, createdAt: -1 });

    return {
      announcements,
      holidays: COMPANY_HOLIDAYS_2026,
      celebrations: EMPLOYEE_CELEBRATIONS
    };
  }

  async createAnnouncement(data, user) {
    const isDbConnected = getDbStatus().isConnected;

    const payload = {
      title: data.title,
      content: data.content,
      category: data.category || 'General',
      priority: data.priority || 'Normal',
      pinned: Boolean(data.pinned),
      authorName: user.name || 'System Admin',
      authorRole: user.role === 'admin' ? 'Executive Leadership' : 'Team Member',
      department: data.department || 'All Departments'
    };

    if (!isDbConnected) {
      return devStore.create(payload);
    }

    const announcement = new Announcement(payload);
    return await announcement.save();
  }

  async deleteAnnouncement(id) {
    const isDbConnected = getDbStatus().isConnected;
    if (!isDbConnected) {
      devStore.delete(id);
      return { success: true };
    }
    await Announcement.findByIdAndDelete(id);
    return { success: true };
  }
}

module.exports = new AnnouncementService();
