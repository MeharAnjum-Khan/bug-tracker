const Project = require('../models/Project');
const Ticket = require('../models/Ticket');

/**
 * @desc    Global search for projects and tickets with strict scoping
 * @route   GET /api/search
 * @access  Private
 */
exports.globalSearch = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim() === '') {
            return res.json({ projects: [], tickets: [] });
        }

        const searchRegex = new RegExp(query, 'i');

        // 1. Get all projects user belongs to (Security + Base for matching)
        const userProjects = await Project.find({
            'teamMembers.user': req.user.id
        }).select('_id name description');

        const allUserProjectIds = userProjects.map(p => p._id);

        // 2. Identify projects that strictly match the search query
        const matchedProjects = userProjects.filter(p =>
            searchRegex.test(p.name) || (p.description && searchRegex.test(p.description))
        );

        const matchedProjectIds = matchedProjects.map(p => p._id);

        let tickets;

        if (matchedProjectIds.length > 0) {
            // STEP A: If project name matches, STRICTLY show issues only from those matched projects
            // This prevents the "glitch" where common terms (like "bug") pull in unrelated projects/issues
            tickets = await Ticket.find({
                project: { $in: matchedProjectIds }
            }).populate('project', 'name')
                .limit(10)
                .select('title description project status priority');
        } else {
            // STEP B: Fallback - if NO project name matches, search issues by title/desc across all accessible projects
            tickets = await Ticket.find({
                project: { $in: allUserProjectIds },
                $or: [
                    { title: searchRegex },
                    { description: searchRegex }
                ]
            }).populate('project', 'name')
                .limit(10)
                .select('title description project status priority');
        }

        res.json({
            projects: matchedProjects.slice(0, 5).map(p => ({
                _id: p._id,
                name: p.name,
                description: p.description
            })),
            tickets
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
