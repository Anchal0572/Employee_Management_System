import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Calendar,
  Gift,
  Award,
  Pin,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { announcementService } from '../services/announcementService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const CATEGORIES = ['All', 'General', 'Townhall & Event', 'Policy Update', 'Holiday & Off', 'Celebration'];

export const NoticeBoard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [celebrations, setCelebrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // New Announcement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Normal',
    pinned: false,
    department: 'All Departments'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await announcementService.getFeed({ category: selectedCategory });
      setAnnouncements(res.announcements);
      setHolidays(res.holidays);
      setCelebrations(res.celebrations);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    setSubmitting(true);
    try {
      await announcementService.createAnnouncement(formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        content: '',
        category: 'General',
        priority: 'Normal',
        pinned: false,
        department: 'All Departments'
      });
      fetchFeed();
    } catch (err) {
      console.error('Broadcast failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this announcement?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      fetchFeed();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return <Badge variant="danger">Urgent</Badge>;
      case 'High':
        return <Badge variant="warning">High Priority</Badge>;
      default:
        return <Badge variant="default">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl text-white shadow-lg shadow-orange-500/15 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Notice Board & Company Hub</h1>
              <p className="text-xs text-amber-100 font-medium">
                Official company announcements, upcoming corporate holidays, and employee celebration milestones.
              </p>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="relative z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <Plus className="w-4 h-4 text-orange-700" />
              <span>Post Announcement</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-orange-500 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Announcements Feed (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-500" />
              Company Broadcasts & Circulars ({announcements.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium text-xs">Loading circulars...</div>
          ) : announcements.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No announcements posted</h3>
              <p className="text-xs text-slate-400 mt-1">Check back later for company updates.</p>
            </Card>
          ) : (
            announcements.map((item) => (
              <div
                key={item._id}
                className={`p-5 rounded-2xl bg-white border ${
                  item.pinned
                    ? 'border-amber-300/90 shadow-xs bg-gradient-to-r from-amber-50/40 via-orange-50/20 to-white'
                    : 'border-slate-200/90 shadow-2xs'
                } hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.pinned && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      {getPriorityBadge(item.priority)}
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mt-2">
                      {item.title}
                    </h4>
                  </div>

                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {item.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Posted by <strong className="text-slate-800">{item.authorName}</strong> ({item.authorRole})
                  </span>
                  <span>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Holidays & Celebrations (1/3 width) */}
        <div className="space-y-6">
          {/* Company Holidays Card */}
          <Card
            className="border-slate-200/90 bg-white shadow-2xs"
            title="Official Holidays 2026"
            subtitle="Corporate Calendar"
          >
            <div className="space-y-3 mt-1">
              {holidays.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{h.name}</span>
                    <span className="text-[11px] text-slate-500 block">{h.day} • {h.type}</span>
                  </div>
                  <span className="font-mono font-bold text-orange-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs text-[11px]">
                    {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Celebrations Card */}
          <Card
            className="border-slate-200/90 bg-white shadow-2xs"
            title="Upcoming Celebrations"
            subtitle="Workforce Milestones"
          >
            <div className="space-y-3 mt-1">
              {celebrations.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-50/80 to-rose-50/80 border border-amber-200/70"
                >
                  <img
                    src={c.avatar}
                    alt={c.employeeName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-bold text-slate-900 block truncate">{c.employeeName}</span>
                    <span className="text-[11px] text-orange-800 font-semibold block truncate">
                      {c.eventType}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{c.department} • {c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Post Announcement Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Broadcast Company Announcement"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Announcement Headline"
              required
              placeholder="e.g. Q2 Vision Townhall or Office Policy Update"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="General">General Circular</option>
                  <option value="Townhall & Event">Townhall & Event</option>
                  <option value="Policy Update">Policy Update</option>
                  <option value="Holiday & Off">Holiday & Off</option>
                  <option value="Celebration">Celebration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Announcement Message Body
              </label>
              <textarea
                rows={4}
                required
                placeholder="Write the full announcement text for the workforce..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pinNotice"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="pinNotice" className="text-xs font-medium text-slate-700 cursor-pointer">
                Pin this notice to top of the board
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="bg-orange-600 hover:bg-orange-700">
                Broadcast Now
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default NoticeBoard;
