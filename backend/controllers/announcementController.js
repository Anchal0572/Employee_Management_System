const announcementService = require('../services/announcementService');
const asyncHandler = require('../utils/asyncHandler');

class AnnouncementController {
  getFeed = asyncHandler(async (req, res) => {
    const { category } = req.query;
    const feed = await announcementService.getAnnouncements({ category });
    res.status(200).json({
      success: true,
      data: feed.announcements,
      holidays: feed.holidays,
      celebrations: feed.celebrations
    });
  });

  createAnnouncement = asyncHandler(async (req, res) => {
    const announcement = await announcementService.createAnnouncement(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted to workforce successfully',
      data: announcement
    });
  });

  deleteAnnouncement = asyncHandler(async (req, res) => {
    const result = await announcementService.deleteAnnouncement(req.params.id);
    res.status(200).json(result);
  });
}

module.exports = new AnnouncementController();
