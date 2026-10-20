const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { check, validationResult } = require('express-validator');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  [auth, [
    check('project', 'Project ID is required').not().isEmpty(),
    check('name', 'Task name is required').not().isEmpty(),
    check('dueDate', 'Please include a valid due date').optional().isISO8601().toDate(),
  ]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { project, name, description, assignedTo, dueDate, priority } = req.body;

      const newCommonTask = new Task({
        project,
        name,
        description,
        assignedTo,
        dueDate,
        priority,
      });

      const task = await newCommonTask.save();
      res.json(task);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
    }
  }
);

// @route   GET api/tasks/project/:projectId
// @desc    Get all tasks for a specific project
// @access  Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo', 'username email');
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   PUT api/tasks/:id/assign
// @desc    Assign a task (Smart Task Assignment placeholder)
// @access  Private
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Placeholder for AI-driven smart assignment logic
    // In a real scenario, AI would suggest the best assignee based on skills, workload, etc.
    task.assignedTo = userId;
    await task.save();

    res.json({ msg: `Task ${task.name} assigned to ${user.username} (Smart Assignment Placeholder)` });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   PUT api/tasks/:id/status
// @desc    Update task status
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    task.status = status;
    await task.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   PUT api/tasks/:id/submit
// @desc    Mark task as submitted (placeholder for File Sharing & Version Control trigger)
// @access  Private
router.put('/:id/submit', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    task.status = 'completed'; // Or a new 'submitted' status
    await task.save();

    res.json({ msg: `Task '${task.name}' submitted. (Trigger for File Sharing & Version Control)` });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   POST api/tasks/:id/ai-assign
// @desc    Get AI-suggested assignee for a task
// @access  Private
router.post('/:id/ai-assign', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    const project = await Project.findById(task.project).populate('members.user', 'username email role');
    if (!project) {
      return res.status(404).json({ msg: 'Project not found for this task' });
    }

    const availableMembers = project.members.map(member => ({
      id: member.user._id,
      username: member.user.username,
      role: member.user.role,
      // Simulate skills and workload for AI prompt - in a real app, this would come from user profiles
      skills: member.user.role === 'student' ? ['frontend', 'backend', 'database'] : ['management', 'review'],
      currentTasks: Math.floor(Math.random() * 5), // Random workload
    }));

    const prompt = `Given the task "${task.name}" (Description: "${task.description || 'N/A'}") and the following project members: ${JSON.stringify(availableMembers)}. Suggest the best member to assign this task to, considering their role, simulated skills, and current workload. Respond with only the user ID of the suggested assignee.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestedUserId = response.text().trim();

    // Validate if the suggested user ID is a valid member of the project
    const suggestedMember = availableMembers.find(member => member.id.toString() === suggestedUserId);

    if (suggestedMember) {
      res.json({ msg: 'AI suggested assignee', suggestedAssignee: suggestedMember });
    } else {
      res.status(400).json({ msg: 'AI could not suggest a valid assignee from the project members.', rawAIResponse: suggestedUserId });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

module.exports = router;
