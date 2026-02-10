const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

/**
 * @desc    Create a new ticket
 * @route   POST /api/tickets
 * @access  Private
 */
exports.createTicket = async (req, res) => {
    try {
        const { title, description, priority, status, assignee, projectId } = req.body;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is member of project
        if (!project.teamMembers.some(m => m.user.toString() === req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to create tickets in this project' });
        }

        const ticket = await Ticket.create({
            title,
            description,
            priority,
            status,
            assignee: assignee || null,
            project: projectId,
            reporter: req.user.id,
        });

        res.status(201).json(ticket);

        // Notify Assignee
        const io = req.app.get('io');
        if (assignee && assignee !== req.user.id) {
            const notification = await Notification.create({
                recipient: assignee,
                sender: req.user.id,
                type: 'Assignment',
                ticket: ticket._id,
                project: projectId,
                message: `assigned you to: ${title}`
            });
            io.emit(`notification-${assignee}`, notification);
        }

        // Emit socket event to project room
        io.to(projectId).emit('ticket-created', ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all tickets for a project
 * @route   GET /api/tickets/project/:projectId
 * @access  Private
 */
exports.getTicketsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if user is member of project
        const project = await Project.findById(projectId);
        if (!project || !project.teamMembers.some(m => m.user.toString() === req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to view tickets for this project' });
        }

        const tickets = await Ticket.find({ project: projectId })
            .populate('assignee', 'name email')
            .populate('reporter', 'name email')
            .populate('project', 'name')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update ticket
 * @route   PUT /api/tickets/:id
 * @access  Private
 */
exports.updateTicket = async (req, res) => {
    try {
        const oldTicket = await Ticket.findById(req.params.id);
        if (!oldTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user is member of the project
        const project = await Project.findById(oldTicket.project);
        if (!project.teamMembers.some(m => m.user.toString() === req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to update this ticket' });
        }

        const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('assignee', 'name').populate('reporter', 'name').populate('project', 'name');

        res.json(ticket);

        const io = req.app.get('io');

        // Notification Logic
        const notifications = [];

        // 1. Assignment changed
        const newAssigneeId = req.body.hasOwnProperty('assignee')
            ? (req.body.assignee ? req.body.assignee.toString() : null)
            : (oldTicket.assignee ? oldTicket.assignee.toString() : null);
        const oldAssigneeId = oldTicket.assignee ? oldTicket.assignee.toString() : null;

        if (newAssigneeId !== oldAssigneeId) {
            // Notify New Assignee
            if (newAssigneeId && newAssigneeId !== req.user.id) {
                notifications.push({
                    recipient: newAssigneeId,
                    sender: req.user.id,
                    type: 'Assignment',
                    ticket: ticket._id,
                    project: ticket.project?._id || ticket.project,
                    message: `assigned you to: ${ticket.title}`
                });
            }

            // Notify Old Assignee
            if (oldAssigneeId && oldAssigneeId !== req.user.id) {
                notifications.push({
                    recipient: oldAssigneeId,
                    sender: req.user.id,
                    type: 'Assignment',
                    ticket: ticket._id,
                    project: ticket.project?._id || ticket.project,
                    message: `You were unassigned from: ${ticket.title}`
                });
            }
        }

        // 2. Status changed
        if (req.body.status && req.body.status !== oldTicket.status) {
            const usersToNotify = [ticket.reporter._id.toString()];
            if (ticket.assignee && ticket.assignee._id.toString() !== ticket.reporter._id.toString()) {
                usersToNotify.push(ticket.assignee._id.toString());
            }

            const uniqueRecipients = [...new Set(usersToNotify.filter(uid => uid !== req.user.id))];
            uniqueRecipients.forEach(uid => {
                notifications.push({
                    recipient: uid,
                    sender: req.user.id,
                    type: 'StatusUpdate',
                    ticket: ticket._id,
                    project: ticket.project?._id || ticket.project,
                    message: `updated status of "${ticket.title}" to ${ticket.status}`
                });
            });
        }

        // Save, Populate and Emit notifications
        for (const n of notifications) {
            const created = await Notification.create(n);
            const populated = await Notification.findById(created._id)
                .populate('sender', 'name')
                .populate('project', 'name')
                .populate('ticket', 'title');
            io.emit(`notification-${n.recipient}`, populated);
        }

        // Emit socket event
        io.to(ticket.project._id.toString()).emit('ticket-updated', ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete ticket
 * @route   DELETE /api/tickets/:id
 * @access  Private
 */
exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user is reporter or project owner
        const project = await Project.findById(ticket.project);
        if (ticket.reporter.toString() !== req.user.id && project.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this ticket' });
        }

        const projectId = ticket.project.toString();
        await ticket.deleteOne();
        res.json({ message: 'Ticket removed' });

        // Emit socket event
        const io = req.app.get('io');
        io.to(projectId).emit('ticket-deleted', req.params.id);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Upload attachments to ticket
 * @route   POST /api/tickets/:id/attachments
 * @access  Private
 */
exports.addAttachments = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const newAttachments = req.files.map(file => ({
            filename: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`
        }));

        ticket.attachments.push(...newAttachments);
        await ticket.save();

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Remove attachment from ticket
 * @route   DELETE /api/tickets/:id/attachments/:attachmentId
 * @access  Private
 */
exports.removeAttachment = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check user role in project
        const project = await Project.findById(ticket.project);
        const member = project?.teamMembers.find(m => m.user.toString() === req.user.id);
        const role = member ? member.role : 'Viewer';

        if (!['Admin', 'Manager', 'Developer'].includes(role)) {
            return res.status(403).json({ message: 'Not authorized to remove attachments' });
        }

        ticket.attachments = ticket.attachments.filter(
            att => att._id.toString() !== req.params.attachmentId
        );

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
