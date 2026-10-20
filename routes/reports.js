const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const pdf = require('html-pdf');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   GET api/reports/:projectId
// @desc    Generate a PDF report for a project (weekly/monthly) with AI summary and risk analysis
// @access  Private
router.get('/:projectId', auth, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'username')
      .lean();
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo', 'username').lean();

    // Compute basic metrics
    const counts = {
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
    };
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((counts.completed / totalTasks) * 100) : 0;

    // Risk detection (simple heuristics)
    const today = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed');
    const nearDueTasks = tasks.filter(t => t.dueDate && (new Date(t.dueDate) - today) / (24*60*60*1000) <= 3 && t.status !== 'completed');
    const milestones = (project.aiPlanDetails && Array.isArray(project.aiPlanDetails.milestones)) ? project.aiPlanDetails.milestones : [];
    const delayedMilestones = milestones.filter(m => new Date(m.dueDate) < today);
    const riskLevel = overdueTasks.length > 3 || delayedMilestones.length > 0 ? 'High' : (nearDueTasks.length > 2 ? 'Moderate' : 'Low');

    // Build AI prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const projectDataForAI = {
      period,
      project: { name: project.name, description: project.description, status: project.status },
      metrics: { counts, totalTasks, completionRate },
      deadlines: { milestones },
      risks: { overdueTasks: overdueTasks.map(t => t.name), delayedMilestones: delayedMilestones.map(m => m.name) }
    };
    const prompt = `You are an academic project assistant. Given this data: ${JSON.stringify(projectDataForAI)}. Write a short ${period} progress summary (4-6 sentences), mention key achievements, blockers, and 2-3 concrete next steps. Return plain text only.`;

    let aiSummary = '';
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiSummary = (response.text() || '').trim();
    } catch (aiError) {
      console.error('Error generating AI summary for report:', aiError);
      aiSummary = `Summary: ${completionRate}% of ${totalTasks} tasks completed. Overdue tasks: ${overdueTasks.length}. Risk level: ${riskLevel}. Suggested focus: close overdue items, unblock in-progress tasks, and review upcoming milestones.`;
    }

    // Simple inline charts
    const bar = (value) => `<div style="background:#e0e0e0;width:100%;height:10px;border-radius:4px;"><div style="background:#4caf50;height:10px;width:${value}%;border-radius:4px;"></div></div>`;

    const svgBarChart = (items, { width = 520, height = 160 } = {}) => {
      if (!Array.isArray(items) || items.length === 0) return '';
      const padding = { top: 10, right: 10, bottom: 30, left: 90 };
      const innerW = width - padding.left - padding.right;
      const innerH = height - padding.top - padding.bottom;
      const maxVal = Math.max(1, ...items.map(i => i.value));
      const barH = Math.max(8, Math.floor(innerH / items.length) - 8);
      let rects = '';
      items.forEach((it, idx) => {
        const w = Math.round((it.value / maxVal) * innerW);
        const by = padding.top + idx * (barH + 8);
        rects += `\n          <text x="${padding.left - 10}" y="${by + barH/2}" text-anchor="end" alignment-baseline="middle" font-size="10" fill="#333">${it.label}</text>
          <rect x="${padding.left}" y="${by}" width="${w}" height="${barH}" fill="#1e88e5" rx="3" />
          <text x="${padding.left + w + 6}" y="${by + barH/2}" alignment-baseline="middle" font-size="10" fill="#333">${it.value}</text>`;
      });
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects}
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#ccc" />
      </svg>`;
    };

    const milestoneTimelineSVG = (milestonesArr, { width = 520, height = 140 } = {}) => {
      if (!Array.isArray(milestonesArr) || milestonesArr.length === 0) return '';
      const padding = { top: 30, right: 20, bottom: 30, left: 20 };
      const innerW = width - padding.left - padding.right;
      const lineY = Math.floor(height / 2);
      const dates = milestonesArr.map(m => new Date(m.dueDate).getTime()).filter(n => !isNaN(n));
      if (dates.length === 0) return '';
      const minD = Math.min(...dates);
      const maxD = Math.max(...dates);
      const range = Math.max(1, maxD - minD);
      const nodes = milestonesArr.map(m => {
        const t = new Date(m.dueDate).getTime();
        const x = padding.left + Math.round(((t - minD) / range) * innerW);
        return { x, name: m.name, date: new Date(m.dueDate).toDateString(), delayed: new Date(m.dueDate) < new Date() };
      });
      const circles = nodes.map(n => `\n        <circle cx="${n.x}" cy="${lineY}" r="5" fill="${n.delayed ? '#e53935' : '#43a047'}" />
        <text x="${n.x}" y="${lineY - 10}" text-anchor="middle" font-size="10" fill="#333">${n.name}</text>
        <text x="${n.x}" y="${lineY + 18}" text-anchor="middle" font-size="9" fill="#555">${n.date}</text>`).join('');
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <line x1="${padding.left}" y1="${lineY}" x2="${width - padding.right}" y2="${lineY}" stroke="#90a4ae" stroke-width="2" />
        ${circles}
      </svg>`;
    };

    const donutSVG = (percent, label, color, { size = 140, stroke = 14 } = {}) => {
      const radius = (size/2) - stroke;
      const circumference = 2 * Math.PI * radius;
      const filled = Math.max(0, Math.min(100, Math.round(percent)));
      const dash = (filled/100) * circumference;
      const gap = circumference - dash;
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" stroke="#e0e0e0" stroke-width="${stroke}" fill="none" />
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-dasharray="${dash} ${gap}" transform="rotate(-90 ${size/2} ${size/2})" stroke-linecap="round"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16" font-weight="700">${filled}%</text>
        <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-size="11" fill="#555">${label}</text>
      </svg>`;
    };

    let html = `
      <div style="font-family: Arial, sans-serif;">
        <div style="border:1px solid #ddd;padding:20px 24px;border-radius:8px;margin-bottom:16px;background:#fafafa;">
          <div style="font-size:22px;font-weight:800;letter-spacing:0.3px;">ACAD-AI Project Hub</div>
          <div style="font-size:16px;margin-top:4px;">${period.charAt(0).toUpperCase()+period.slice(1)} Report</div>
          <div style="margin-top:8px;color:#444;"><strong>${project.name}</strong></div>
          <div style="color:#666;">${project.description || ''}</div>
          <div style="margin-top:6px;color:#666;">Owner: ${project.owner.username} &nbsp; | &nbsp; Status: <strong>${project.status}</strong></div>
        </div>

        <h2 style="margin:12px 0 6px;">AI Summary</h2>
        <p style="line-height:1.6;">${aiSummary}</p>

        <h2 style="margin:12px 0 6px;">Progress Overview</h2>
        <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
          ${donutSVG(completionRate, 'Completion Rate', '#3f51b5')}
          ${donutSVG(totalTasks>0?Math.round((counts.completed/totalTasks)*100):0, 'Completed ('+counts.completed+')', '#43a047')}
          ${donutSVG(totalTasks>0?Math.round((counts.inProgress/totalTasks)*100):0, 'In Progress ('+counts.inProgress+')', '#1e88e5')}
          ${donutSVG(totalTasks>0?Math.round((counts.pending/totalTasks)*100):0, 'Pending ('+counts.pending+')', '#fbc02d')}
          ${donutSVG(totalTasks>0?Math.round((counts.blocked/totalTasks)*100):0, 'Blocked ('+counts.blocked+')', '#e53935')}
        </div>
        <div style="margin-top:10px;">${svgBarChart([
          { label: 'Completed', value: counts.completed },
          { label: 'In Progress', value: counts.inProgress },
          { label: 'Pending', value: counts.pending },
          { label: 'Blocked', value: counts.blocked },
        ])}</div>

        <h2 style="margin:12px 0 6px;">Milestones</h2>
        <div style="margin:8px 0;">${milestoneTimelineSVG(milestones)}</div>
        <ul style="margin-top:6px;">
          ${milestones.map(m => `<li>${m.name} - Due: ${new Date(m.dueDate).toDateString()} ${new Date(m.dueDate) < today ? '(Delayed)' : ''}</li>`).join('')}
        </ul>

        <h2 style="margin:12px 0 6px;">Risks</h2>
        <p>Risk Level: <strong>${riskLevel}</strong></p>
        <ul>
          <li>Overdue Tasks: ${overdueTasks.map(t => t.name).join(', ') || 'None'}</li>
          <li>Delayed Milestones: ${delayedMilestones.map(m => m.name).join(', ') || 'None'}</li>
        </ul>

        <h2 style="margin:12px 0 6px;">Tasks</h2>
        <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #eee;">
          <thead>
            <tr style="background:#f5f5f5;"><th align="left">Task</th><th align="left">Status</th><th align="left">Assigned To</th><th align="left">Due Date</th></tr>
          </thead>
          <tbody>
    `;

    tasks.forEach(task => {
      const taskName = task && task.name ? task.name : '(Untitled Task)';
      const status = task && task.status ? task.status : 'pending';
      const assigned = task && task.assignedTo && task.assignedTo.username ? task.assignedTo.username : '—';
      const due = task && task.dueDate ? new Date(task.dueDate).toDateString() : 'N/A';
      html += `<tr><td>${taskName}</td><td>${status}</td><td>${assigned}</td><td>${due}</td></tr>`;
    });

    html += `</tbody></table></div>`;

    // Return the HTML directly so the frontend can display/print it natively
    // html-pdf uses phantomjs which crashes in Vercel serverless environments
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

module.exports = router;
