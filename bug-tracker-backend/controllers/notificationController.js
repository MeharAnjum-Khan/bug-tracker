const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for the logged in user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'name')
            .populate('project', 'name')
            .populate('ticket', 'title')
            .sort({ createdAt: -1 })
            .limit(50); // Keep it efficient

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check ownership
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Mark all notifications as read for the user
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    TEMP: Clear all notifications from database
 * @route   DELETE /api/notifications/clear-all-test
 * @access  Private
 */
exports.deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({});
        res.json({ message: 'Database cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
