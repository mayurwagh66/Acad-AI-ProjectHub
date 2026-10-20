const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   GET api/feedback/faculty/:projectId
// @desc    Get AI-driven feedback suggestions for faculty for a project
// @access  Private (Faculty only)
router.get('/faculty/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Ensure the requesting user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ msg: 'Access denied. Faculty only.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    let feedbackTarget = `project ${project.name}`;
    let taskQuery = { project: projectId };

    const tasks = await Task.find(taskQuery);

    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const overdueTasks = tasks.filter(task => task.dueDate && task.dueDate < new Date() && task.status !== 'completed').length;
    const totalTasks = tasks.length;

    // AI-driven feedback logic
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const feedbackDataForAI = {
      project: { name: project.name, description: project.description },
      target: feedbackTarget,
      performanceMetrics: {
        completedTasks, inProgressTasks, overdueTasks, totalTasks
      },
      tasks: tasks.map(task => ({ name: task.name, status: task.status, dueDate: task.dueDate }))
    };
    const prompt = `Given the following project and performance data for ${feedbackTarget}: ${JSON.stringify(feedbackDataForAI)}. Provide a concise performance summary (1-2 sentences) and 3 actionable feedback suggestions. Format the output as a JSON object with 'summary' (string) and 'suggestions' (array of strings).`;

    let aiFeedbackSummary = `AI-generated summary for ${feedbackTarget}: No specific feedback generated.`;
    let aiFeedbackSuggestions = ['No AI suggestions available at this time.'];

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      const parsedAIResponse = JSON.parse(text);
      if (parsedAIResponse.summary) {
        aiFeedbackSummary = parsedAIResponse.summary;
      }
      if (Array.isArray(parsedAIResponse.suggestions)) {
        aiFeedbackSuggestions = parsedAIResponse.suggestions;
      }
    } catch (aiError) {
      console.error('Error generating AI feedback:', aiError);
    }

    const aiFeedback = {
      summary: aiFeedbackSummary,
      suggestions: aiFeedbackSuggestions,
      performanceMetrics: {
        tasksCompleted: completedTasks,
        tasksInProgress: inProgressTasks,
        overdueTasks: overdueTasks,
        avgCompletionTime: 'N/A', // This would require more complex logic to calculate
      },
    };

    res.json({ msg: `AI Feedback Suggestions for ${feedbackTarget}`, aiFeedback });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   GET api/feedback/faculty/:projectId/:studentId
// @desc    Get AI-driven feedback suggestions for faculty for a specific student in a project
// @access  Private (Faculty only)
router.get('/faculty/:projectId/:studentId', auth, async (req, res) => {
  try {
    const { projectId, studentId } = req.params;

    // Ensure the requesting user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ msg: 'Access denied. Faculty only.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const targetUser = await User.findById(studentId);
    if (!targetUser || targetUser.role !== 'student') {
      return res.status(404).json({ msg: 'Student not found or invalid role' });
    }
    const feedbackTarget = `student ${targetUser.username} in project ${project.name}`;
    const taskQuery = { project: projectId, assignedTo: studentId };

    const tasks = await Task.find(taskQuery);

    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const overdueTasks = tasks.filter(task => task.dueDate && task.dueDate < new Date() && task.status !== 'completed').length;
    const totalTasks = tasks.length;

    // AI-driven feedback logic
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const feedbackDataForAI = {
      project: { name: project.name, description: project.description },
      target: feedbackTarget,
      performanceMetrics: {
        completedTasks, inProgressTasks, overdueTasks, totalTasks
      },
      tasks: tasks.map(task => ({ name: task.name, status: task.status, dueDate: task.dueDate }))
    };
    const prompt = `Given the following project and performance data for ${feedbackTarget}: ${JSON.stringify(feedbackDataForAI)}. Provide a concise performance summary (1-2 sentences) and 3 actionable feedback suggestions. Format the output as a JSON object with 'summary' (string) and 'suggestions' (array of strings).`;

    let aiFeedbackSummary = `AI-generated summary for ${feedbackTarget}: No specific feedback generated.`;
    let aiFeedbackSuggestions = ['No AI suggestions available at this time.'];

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      const parsedAIResponse = JSON.parse(text);
      if (parsedAIResponse.summary) {
        aiFeedbackSummary = parsedAIResponse.summary;
      }
      if (Array.isArray(parsedAIResponse.suggestions)) {
        aiFeedbackSuggestions = parsedAIResponse.suggestions;
      }
    } catch (aiError) {
      console.error('Error generating AI feedback:', aiError);
    }

    const aiFeedback = {
      summary: aiFeedbackSummary,
      suggestions: aiFeedbackSuggestions,
      performanceMetrics: {
        tasksCompleted: completedTasks,
        tasksInProgress: inProgressTasks,
        overdueTasks: overdueTasks,
        avgCompletionTime: 'N/A', // This would require more complex logic to calculate
      },
    };

    res.json({ msg: `AI Feedback Suggestions for ${feedbackTarget}`, aiFeedback });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

module.exports = router;
