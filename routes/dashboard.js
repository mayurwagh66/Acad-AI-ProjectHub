const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project'); // Added Project model import

// @route   GET api/dashboard
// @desc    Get dashboard data based on user role
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role === 'student') {
      const studentProjects = await Project.find({ 'members.user': req.user.id })
        .populate('owner', 'username')
        .populate('members.user', 'username')
        .sort({ updatedAt: -1 });
      
      // Calculate student dashboard metrics
      const totalProjects = studentProjects.length;
      const activeProjects = studentProjects.filter(p => p.status === 'in-progress').length;
      const completedProjects = studentProjects.filter(p => p.status === 'completed').length;
      const pendingProjects = studentProjects.filter(p => p.status === 'pending').length;

      res.json({ 
        msg: 'Welcome to the Student Dashboard', 
        user: user, 
        projects: studentProjects,
        metrics: {
          totalProjects,
          activeProjects,
          completedProjects,
          pendingProjects
        }
      });
    } else if (user.role === 'faculty') {
      // Get projects assigned to this faculty member
      const assignedProjects = await Project.find({ assignedFaculty: req.user.id })
        .populate('owner', 'username')
        .populate('members.user', 'username')
        .populate('assignedFaculty', 'username')
        .sort({ updatedAt: -1 });
      
      // Get projects where faculty is a member (if any)
      const memberProjects = await Project.find({ 'members.user': req.user.id })
        .populate('owner', 'username')
        .populate('members.user', 'username')
        .sort({ updatedAt: -1 });

      // Calculate faculty dashboard metrics
      const totalAssignedProjects = assignedProjects.length;
      const activeProjects = assignedProjects.filter(p => p.status === 'in-progress').length;
      const completedProjects = assignedProjects.filter(p => p.status === 'completed').length;
      const pendingProjects = assignedProjects.filter(p => p.status === 'pending').length;

      res.json({ 
        msg: 'Welcome to the Faculty Dashboard', 
        user: user, 
        assignedProjects: assignedProjects,
        memberProjects: memberProjects,
        metrics: {
          totalAssigned: totalAssignedProjects,
          active: activeProjects,
          completed: completedProjects,
          pending: pendingProjects
        }
      });
    } else {
      res.status(403).json({ msg: 'Unauthorized role' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

module.exports = router;
