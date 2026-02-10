const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');

/**
 * @desc    Add a comment to a ticket
 * @route   POST /api/comments
 * @access  Private
 */
exports.addComment = async (req, res) => {
    try {
        const { text, ticketId } = req.body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const comment = await Comment.create({
            text,
            ticket: ticketId,
            user: req.user.id,
        });

        // Populate user name for immediate frontend update
        const populatedComment = await Comment.findById(comment._id).populate('user', 'name');

        res.status(201).json(populatedComment);

        // Notify Reporter and Assignee
        const io = req.app.get('io');
        const usersToNotify = [ticket.reporter.toString()];
        if (ticket.assignee && ticket.assignee.toString() !== ticket.reporter.toString()) {
            usersToNotify.push(ticket.assignee.toString());
        }

        // Filter out the person who just commented
        const recipients = usersToNotify.filter(uid => uid !== req.user.id);

        for (const recipientId of recipients) {
            const notification = await Notification.create({
                recipient: recipientId,
                sender: req.user.id,
                type: 'Comment',
                ticket: ticket._id,
                project: ticket.project,
                message: `commented on: ${ticket.title}`
            });
            io.emit(`notification-${recipientId}`, notification);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all comments for a ticket
 * @route   GET /api/comments/ticket/:ticketId
 * @access  Private
 */
exports.getCommentsByTicket = async (req, res) => {
    try {
        const comments = await Comment.find({ ticket: req.params.ticketId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only the author can delete the comment
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await comment.deleteOne();

        res.json({ message: 'Comment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
