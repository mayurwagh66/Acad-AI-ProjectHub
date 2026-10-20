const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const Project = require('../models/Project');

// @route   POST api/chat/projects/:projectId
// @desc    Send a new chat message to a project
// @access  Private
router.post(
  '/projects/:projectId',
  [auth, [check('message', 'Message is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ msg: 'Project not found' });
      }

      // Check if user is a member or owner of the project
      const isMember = project.members.some(member => member.user.toString() === req.user.id);
      const isOwner = project.owner.toString() === req.user.id;

      if (!isMember && !isOwner) {
        return res.status(401).json({ msg: 'Not authorized to chat in this project' });
      }

      const newChatMessage = new ChatMessage({
        project: req.params.projectId,
        sender: req.user.id,
        message: req.body.message,
      });

      const chatMessage = await newChatMessage.save();
      // Populate sender details for the response
      await chatMessage.populate('sender', 'username');

      // Broadcast the new message via Socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.projectId).emit('new_message', chatMessage);
      }

      res.json(chatMessage);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
    }
  }
);

// @route   GET api/chat/projects/:projectId
// @desc    Get all chat messages for a project
// @access  Private
router.get('/projects/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a member or owner of the project
    const isMember = project.members.some(member => member.user.toString() === req.user.id);
    const isOwner = project.owner.toString() === req.user.id;

    if (!isMember && !isOwner) {
      return res.status(401).json({ msg: 'Not authorized to view chat in this project' });
    }

    const chatMessages = await ChatMessage.find({ project: req.params.projectId })
      .populate('sender', 'username') // Populate sender's username
      .sort({ timestamp: 1 }); // Sort by oldest first

    res.json(chatMessages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

module.exports = router;
