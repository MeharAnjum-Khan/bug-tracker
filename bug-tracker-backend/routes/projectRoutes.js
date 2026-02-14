const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getTrashedProjects,
    restoreProject,
    permanentlyDeleteProject,
    addMember,
    removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// All project routes are protected
router.use(protect);

router.route('/')
    .post(createProject)
    .get(getProjects);

router.get('/trash', getTrashedProjects);

router.route('/:id')
    .get(getProjectById)
    .put(updateProject)
    .delete(deleteProject);

router.put('/:id/restore', restoreProject);
router.delete('/:id/permanent', permanentlyDeleteProject);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
