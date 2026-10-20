const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   GET api/analytics/productivity
// @desc    Get overall productivity insights for the user
// @access  Private
router.get('/productivity', auth, async (req, res) => {
  try {
    const userProjects = await Project.find({ 'members.user': req.user.id }).select('_id');
    const projectIds = userProjects.map(project => project._id);
    const query = { project: { $in: projectIds } };

    const completedTasks = await Task.countDocuments({ ...query, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ ...query, status: 'in-progress' });
    const totalTasks = completedTasks + inProgressTasks + await Task.countDocuments({ ...query, status: 'pending' }) + await Task.countDocuments({ ...query, status: 'blocked' });
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;

    // AI-driven insights with Gemini API (use supported model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `Given the following overall productivity metrics: Completed Tasks = ${completedTasks}, In Progress Tasks = ${inProgressTasks}, Total Tasks = ${totalTasks}, Completion Rate = ${completionRate}%. Provide 3-5 concise, actionable AI suggestions to improve productivity. Format the output as a JSON array of strings. For example: ["Suggestion 1", "Suggestion 2"].`;

    // Build basic per-member stats
    const projectTasks = await Task.find({ project: { $in: projectIds } }).populate('assignedTo', 'username');
    const byUser = new Map();
    projectTasks.forEach(t => {
      const key = t.assignedTo ? (t.assignedTo.username || String(t.assignedTo)) : 'Unassigned';
      if (!byUser.has(key)) byUser.set(key, { total: 0, completed: 0 });
      const s = byUser.get(key); s.total += 1; if (t.status === 'completed') s.completed += 1;
    });

    let aiSuggestions;
    let aiInsights = null; // three concise lines
    let rawText;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      rawText = response.text();
      // Prompt for three insights
      const topUser = Array.from(byUser.entries()).sort((a,b)=> (b[1].completed/(b[1].total||1)) - (a[1].completed/(a[1].total||1)))[0]?.[0] || 'N/A';
      const lowUser = Array.from(byUser.entries()).sort((a,b)=> (a[1].completed/(a[1].total||1)) - (b[1].completed/(b[1].total||1)))[0]?.[0] || 'N/A';
      const insightPrompt = `You are an AI assistant for a student project platform. Analyze this data and give EXACTLY 3 short insights (one sentence each): 1) Who is performing well, 2) Who needs improvement, 3) One suggestion for the whole team. Data: counts=${JSON.stringify({completedTasks,inProgressTasks,totalTasks,completionRate})}, members=${JSON.stringify(Object.fromEntries(byUser))}. Return JSON: {"performingWell": string, "needsImprovement": string, "teamSuggestion": string}`;
      const insightModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      let insightText = '';
      try {
        const result2 = await insightModel.generateContent(insightPrompt);
        insightText = result2.response.text();
        aiInsights = JSON.parse(insightText);
      } catch (_) {
        aiInsights = {
          performingWell: `${topUser} is performing well with the highest completion ratio.`,
          needsImprovement: `${lowUser} needs improvement; focus on closing pending tasks.`,
          teamSuggestion: 'Balance workload and review blockers in standups to avoid bottlenecks.'
        };
      }
      // Backward-compatible suggestions list
      try {
        aiSuggestions = JSON.parse(rawText);
        if (!Array.isArray(aiSuggestions)) throw new Error('not array');
      } catch (_) {
        aiSuggestions = [
          'Close overdue tasks first to raise completion rate.',
          'Break large tasks into smaller sub-tasks to maintain flow.',
          'Share workload if a member has too many pending items.'
        ];
      }
    } catch (parseError) {
      console.error('Error parsing AI response for productivity insights:', parseError);
      if (rawText) console.error('AI Raw Response:', rawText);
      aiSuggestions = ['Could not generate AI suggestions at this time.'];
      // Fallback insights
      const entries = Array.from(byUser.entries());
      const ranked = entries.map(([u,s])=>({u,ratio:(s.completed/(s.total||1))})).sort((a,b)=>b.ratio-a.ratio);
      const top = ranked[0]?.u || 'N/A';
      const low = ranked[ranked.length-1]?.u || 'N/A';
      aiInsights = {
        performingWell: `${top} is performing well with consistent task completion.`,
        needsImprovement: `${low} needs improvement; plan time for pending tasks.`,
        teamSuggestion: 'Rebalance assignments to distribute workload evenly.'
      };
    }

    const insights = {
      completedTasks,
      inProgressTasks,
      totalTasks,
      completionRate,
      aiSuggestions,
      aiInsights,
    };

    res.json(insights);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   GET api/analytics/productivity/:projectId
// @desc    Get productivity insights for a specific project
// @access  Private
router.get('/productivity/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const query = { project: projectId };

    const completedTasks = await Task.countDocuments({ ...query, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ ...query, status: 'in-progress' });
    const totalTasks = completedTasks + inProgressTasks + await Task.countDocuments({ ...query, status: 'pending' }) + await Task.countDocuments({ ...query, status: 'blocked' });
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;

    // AI-driven insights with Gemini API (use supported model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Given the following productivity metrics for project ID ${projectId}: Completed Tasks = ${completedTasks}, In Progress Tasks = ${inProgressTasks}, Total Tasks = ${totalTasks}, Completion Rate = ${completionRate}%. Provide 3-5 concise, actionable AI suggestions to improve productivity for this project. Format the output as a JSON array of strings. For example: ["Suggestion 1", "Suggestion 2"].`;

    let aiSuggestions;
    let rawText;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      rawText = response.text();
      aiSuggestions = JSON.parse(rawText);
      if (!Array.isArray(aiSuggestions)) {
        throw new Error("AI response is not an array.");
      }
    } catch (parseError) {
      console.error('Error parsing AI response for productivity insights:', parseError);
      if (rawText) console.error('AI Raw Response:', rawText);
      aiSuggestions = ['Could not generate AI suggestions at this time.'];
    }

    const insights = {
      completedTasks,
      inProgressTasks,
      totalTasks,
      completionRate,
      aiSuggestions,
      // add basic breakdown for faculty charts
      breakdown: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: await Task.countDocuments({ ...query, status: 'pending' }),
        blocked: await Task.countDocuments({ ...query, status: 'blocked' })
      }
    };

    res.json(insights);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

module.exports = router;
