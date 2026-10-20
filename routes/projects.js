const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User'); // Import User model
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST api/projects
// @desc    Create a project
// @access  Private
router.post(
  '/',
  [auth, [check('name', 'Project name is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newProject = new Project({
        name: req.body.name,
        description: req.body.description,
        owner: req.user.id,
        members: [{ user: req.user.id, role: req.user.role }], // Add owner as a member by default
      });

      const project = await newProject.save();
      res.json(project);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
    }
  }
);

// @route   POST api/projects/join
// @desc    Allow a student to join an existing project
// @access  Private (Student only)
router.post(
  '/join',
  [auth, [check('projectId', 'Project ID is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        return res.status(404).json({ msg: 'Project not found' });
      }

      // Check if user is already a member or owner
      const isMember = project.members.some(member => member.user.toString() === req.user.id);
      const isOwner = project.owner.toString() === req.user.id;

      if (isMember || isOwner) {
        return res.status(400).json({ msg: 'You are already a member of this project' });
      }

      // Add student to project members
      project.members.push({ user: req.user.id, role: 'student' });
      await project.save();

      res.json({ msg: 'Successfully joined project', project });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
    }
  }
);

// @route   GET api/projects
// @desc    Get all projects for the authenticated user (owner or member)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Find projects where the user is either the owner or a member
    const projects = await Project.find({
      $or: [{ owner: req.user.id }, { 'members.user': req.user.id }],
    })
      .populate('owner', 'username email')
      .populate('members.user', 'username email role') // Populate members' user details
      .sort({ startDate: -1 });
    res.json(projects);
  } catch (err) {
    console.error('AI plan error:', err && err.message ? err.message : err);
    res.status(500).json({ msg: 'Server Error', error: err && err.message ? err.message : String(err) });
  }
});

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email role'); // Populate members' user details

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is owner or member
    const isAuthorized =
      project.owner.toString() === req.user.id ||
      project.members.some((member) => member.user._id.toString() === req.user.id) ||
      req.user.role === 'faculty'; // Faculty can view any project read-only

    if (!isAuthorized) {
      return res.status(401).json({ msg: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, description, status, endDate, aiPlanStatus, aiPlanDetails, teamLeaderApprovedBy, facultyEvaluation, projectGrade } = req.body;

  // Build project object
  const projectFields = {};
  if (name) projectFields.name = name;
  if (description) projectFields.description = description;
  if (status) projectFields.status = status;
  if (endDate) projectFields.endDate = endDate;
  if (aiPlanStatus) projectFields.aiPlanStatus = aiPlanStatus;
  if (aiPlanDetails) projectFields.aiPlanDetails = aiPlanDetails;
  if (teamLeaderApprovedBy) projectFields.teamLeaderApprovedBy = teamLeaderApprovedBy;
  if (facultyEvaluation) projectFields.facultyEvaluation = facultyEvaluation;
  if (projectGrade) projectFields.projectGrade = projectGrade;

  try {
    let project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ msg: 'Project not found' });

    // Ensure user is project owner or team leader for plan approval
    const userRole = req.user.role;
    const isOwner = project.owner.toString() === req.user.id;
    const isTeamLeader = userRole === 'team_leader';
    const isFaculty = userRole === 'faculty';

    // Only owner can update basic project details (name, description, endDate)
    if ((name || description || endDate) && !isOwner) {
        return res.status(401).json({ msg: 'Not authorized to update these project details' });
    }

    // Only Team Leader or Faculty can mark project as completed
    if (typeof status === 'string') {
        const normalized = status.toLowerCase();
        if (normalized === 'completed' && !(isTeamLeader || isFaculty)) {
            return res.status(403).json({ msg: 'Only Team Leaders or Faculty can mark a project as completed' });
        }
    }

    // Team Leader can approve/reject plans
    if ((aiPlanStatus && (aiPlanStatus === 'approved' || aiPlanStatus === 'rejected')) && !isTeamLeader) {
        return res.status(401).json({ msg: 'Only Team Leaders can approve/reject AI plans' });
    }

    // Faculty can evaluate projects
    if ((facultyEvaluation || projectGrade) && !isFaculty) {
      return res.status(401).json({ msg: 'Only Faculty can evaluate projects' });
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    );

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private (Owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Ensure user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Project.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   POST api/projects/ai-plan
// @desc    Generate AI-driven task plan for a project
// @access  Private
router.post('/ai-plan', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.body.projectId);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Ensure user is a member of the project
    const isMember = project.members.some(member => member.user.toString() === req.user.id);
    if (!isMember && project.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to generate AI plan for this project' });
    }

    // Helper: fallback plan if AI fails
    const buildFallbackPlan = () => {
      const addDays = (d, days) => {
        const nd = new Date(d.getTime());
        nd.setDate(nd.getDate() + days);
        return nd;
      };
      const today = new Date();
      const fmt = (d) => d.toISOString().split('T')[0];
      const suggestions = [
        { taskName: 'Requirements Gathering', timeline: '3 days' },
        { taskName: 'Background Research', timeline: '1 week' },
        { taskName: 'Design Architecture', timeline: '1 week' },
        { taskName: 'Prototype Implementation', timeline: '2 weeks' },
        { taskName: 'Testing & QA', timeline: '1 week' },
        { taskName: 'Documentation', timeline: '3 days' }
      ];
      const milestones = [
        { name: 'Proposal Ready', dueDate: fmt(addDays(today, 14)) },
        { name: 'Prototype Complete', dueDate: fmt(addDays(today, 28)) },
        { name: 'Final Report & Demo', dueDate: fmt(addDays(today, 42)) }
      ];
      const weekdays = ['Mon','Tue','Wed','Thu','Fri'];
      const itinerary = [];
      for (let w = 1; w <= 4; w++) {
        itinerary.push({
          week: w,
          days: weekdays.map((day, i) => ({ day, todo: suggestions[(w + i) % suggestions.length].taskName, tips: 'Focus on small deliverables.' }))
        });
      }
      return { suggestions, milestones, itinerary };
    };

    let aiPlannedTasks = null;
    try {
      // Skip AI if key missing
      if (!process.env.GEMINI_API_KEY) {
        aiPlannedTasks = buildFallbackPlan();
      } else {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `You are an AI project assistant for students. Given the project name "${project.name}" and description "${project.description}", produce an itinerary-style plan that guides the team week-by-week.\n\nReturn STRICTLY valid JSON with this shape:\n{\n  "suggestions": [{ "taskName": string, "timeline": string }],\n  "milestones": [{ "name": string, "dueDate": string }],\n  "itinerary": [ { "week": number, "days": [ { "day": string, "todo": string, "tips": string } ] } ]\n}\n\nRules:\n- Keep 6-10 items in suggestions with concise names.\n- Use timelines like "3 days", "1 week", "2 weeks".\n- Provide 3-5 milestones with realistic dates in the next 2-12 weeks (YYYY-MM-DD).\n- For itinerary, provide at least 2 weeks (prefer 4), each with 5 weekdays (Mon-Fri) and short actionable todos and tips.\n- No extra commentary, ONLY JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
          aiPlannedTasks = JSON.parse(text);
        } catch (parseError) {
          const match = text.match(/\{[\s\S]*\}$/);
          if (match) {
            try { aiPlannedTasks = JSON.parse(match[0]); } catch (_) {}
          }
          if (!aiPlannedTasks) {
            console.error('Error parsing AI response:', parseError);
            console.error('AI Raw Response:', text);
            aiPlannedTasks = buildFallbackPlan();
          }
        }

        // Persist plan to project so Team Leader can review later
        project.aiPlanDetails = aiPlannedTasks;
        project.aiPlanStatus = 'pending_review';
        await project.save();
      }
    } catch (aiErr) {
      console.error('Gemini call failed, using fallback plan:', aiErr && aiErr.message ? aiErr.message : aiErr);
      aiPlannedTasks = buildFallbackPlan();
    }

    // Ensure milestone dates are strings
    if (aiPlannedTasks.milestones) {
      aiPlannedTasks.milestones = aiPlannedTasks.milestones.map(m => ({
        ...m,
        dueDate: (typeof m.dueDate === 'string') ? m.dueDate : new Date(m.dueDate).toISOString().split('T')[0],
      }));
    }

    res.json({ msg: 'AI Task Planning initiated', aiPlannedTasks });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   PUT api/projects/approve-plan/:projectId
// @desc    Approve an AI-generated project plan (Team Leader only)
// @access  Private
router.put('/approve-plan/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        if (req.user.role !== 'team_leader') {
            return res.status(403).json({ msg: 'Access denied. Only Team Leaders can approve plans.' });
        }

        if (project.aiPlanStatus !== 'pending_review') {
            return res.status(400).json({ msg: 'Project plan is not pending review.' });
        }

        project.aiPlanStatus = 'approved';
        project.teamLeaderApprovedBy = req.user.id;
        await project.save();

        res.json({ msg: 'Project plan approved successfully!', project });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
    }
});

// @route   PUT api/projects/reject-plan/:projectId
// @desc    Reject an AI-generated project plan (Team Leader only)
// @access  Private
router.put('/reject-plan/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        if (req.user.role !== 'team_leader') {
            return res.status(403).json({ msg: 'Access denied. Only Team Leaders can reject plans.' });
        }

        if (project.aiPlanStatus !== 'pending_review') {
            return res.status(400).json({ msg: 'Project plan is not pending review.' });
        }

        project.aiPlanStatus = 'rejected';
        project.aiPlanDetails = null; // Clear AI plan details on rejection
        project.teamLeaderApprovedBy = req.user.id;
        await project.save();

        res.json({ msg: 'Project plan rejected.', project });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
    }
});

// @route   PUT api/projects/evaluate/:projectId
// @desc    Faculty evaluates a project
// @access  Private (Faculty only)
router.put('/evaluate/:projectId', auth, async (req, res) => {
  try {
    const { facultyEvaluation, projectGrade } = req.body;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (req.user.role !== 'faculty') {
      return res.status(403).json({ msg: 'Access denied. Only Faculty can evaluate projects.' });
    }

    project.facultyEvaluation = facultyEvaluation;
    project.projectGrade = projectGrade;
    await project.save();

    res.json({ msg: 'Project evaluated successfully!', project });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   PUT api/projects/assign-faculty/:projectId
// @desc    Assign current faculty user to monitor a project
// @access  Private (Faculty only)
router.put('/assign-faculty/:projectId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ msg: 'Only Faculty can be assigned to projects' });
    }
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    
    // Assign faculty as the monitoring faculty
    project.assignedFaculty = req.user.id;
    
    // Also add faculty as a member if not already a member
    const isAlreadyMember = project.members.some(member => member.user.toString() === req.user.id);
    if (!isAlreadyMember) {
      project.members.push({ user: req.user.id, role: 'faculty' });
    }
    
    await project.save();
    
    const populated = await Project.findById(project.id)
      .populate('assignedFaculty', 'username email')
      .populate('owner', 'username')
      .populate('members.user', 'username');
      
    res.json({ msg: 'Faculty assigned to project', project: populated });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// Lightweight suggestions stream stored on project
// Extend schema via minimal subdocument array

// @route   POST api/projects/:projectId/faculty-suggestions
// @desc    Faculty posts a suggestion/feedback for a project
// @access  Private (Faculty only)
router.post('/:projectId/faculty-suggestions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ msg: 'Only Faculty can post suggestions' });
    }
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ msg: 'Message is required' });
    }
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    project.facultySuggestions = project.facultySuggestions || [];
    project.facultySuggestions.push({ faculty: req.user.id, message: message.trim() });
    await project.save();

    const populated = await Project.findById(project.id)
      .populate('facultySuggestions.faculty', 'username email')
      .select('facultySuggestions');

    res.json({ msg: 'Suggestion added', suggestions: populated.facultySuggestions });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   GET api/projects/:projectId/faculty-suggestions
// @desc    List suggestions/feedback for a project
// @access  Private (Owner, members, or faculty)
router.get('/:projectId/faculty-suggestions', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('facultySuggestions.faculty', 'username email');
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    const isAuthorized =
      project.owner.toString() === req.user.id ||
      project.members.some((m) => m.user.toString() === req.user.id) ||
      req.user.role === 'faculty';
    if (!isAuthorized) return res.status(401).json({ msg: 'Not authorized' });

    res.json({ suggestions: project.facultySuggestions || [] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// module.exports moved to end of file to ensure all routes are registered

// --- Auto Milestones Generation --- //
// @route   POST api/projects/auto-milestones
// @desc    Generate milestones based on duration/deadline, task complexities, and dependencies
// @access  Private (Owner, members, or faculty read-only but can generate)
router.post('/auto-milestones', auth, async (req, res) => {
  try {
    const { projectId, durationDays, deadline, tasks } = req.body || {};
    if (!projectId) return res.status(400).json({ msg: 'projectId is required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    const isAuthorized = (
      project.owner.toString() === req.user.id ||
      project.members.some((m) => (m.user.toString ? m.user.toString() : String(m.user)) === req.user.id) ||
      req.user.role === 'faculty'
    );
    if (!isAuthorized) return res.status(401).json({ msg: 'Not authorized' });

    // Determine total days
    let totalDays = parseInt(durationDays, 10);
    if (!totalDays || isNaN(totalDays) || totalDays <= 0) {
      if (deadline) {
        const end = new Date(deadline);
        const start = project.startDate ? new Date(project.startDate) : new Date();
        totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
      } else if (project.endDate) {
        const end = new Date(project.endDate);
        const start = project.startDate ? new Date(project.startDate) : new Date();
        totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
      } else {
        totalDays = 45; // sensible default
      }
    }

    // Simple complexity weighting
    const parsedTasks = Array.isArray(tasks) ? tasks : [];
    const weights = { low: 1, medium: 2, high: 3 };
    const totalWeight = parsedTasks.reduce((acc, t) => acc + (weights[(t.complexity || '').toLowerCase()] || 1), 0) || 1;

    // Phase boundaries at 25/50/75/100%
    const checkpoints = [0.25, 0.5, 0.75, 0.9, 1.0];
    const startDate = project.startDate ? new Date(project.startDate) : new Date();
    const addDays = (base, d) => {
      const nd = new Date(base.getTime());
      nd.setDate(nd.getDate() + d);
      return nd.toISOString().split('T')[0];
    };

    // Assign tasks into phases by cumulative weight
    const phases = [[], [], [], []];
    if (parsedTasks.length > 0) {
      let cumulative = 0;
      parsedTasks.forEach(t => {
        const w = (weights[(t.complexity || '').toLowerCase()] || 1);
        cumulative += w;
        const ratio = cumulative / totalWeight;
        if (ratio <= 0.25) phases[0].push(t);
        else if (ratio <= 0.5) phases[1].push(t);
        else if (ratio <= 0.75) phases[2].push(t);
        else phases[3].push(t);
      });
    }

    const namesFrom = (arr, fallback) => (arr.length ? arr.map(t => t.name || t.taskName).filter(Boolean).join(', ') : fallback);

    const milestones = [
      {
        name: 'Milestone 1 (25%)',
        dueDate: addDays(startDate, Math.round(totalDays * checkpoints[0])),
        summary: namesFrom(phases[0], 'Initial groundwork and setup'),
      },
      {
        name: 'Milestone 2 (50%)',
        dueDate: addDays(startDate, Math.round(totalDays * checkpoints[1])),
        summary: namesFrom(phases[1], 'Data preparation and mid-review'),
      },
      {
        name: 'Milestone 3 (75%)',
        dueDate: addDays(startDate, Math.round(totalDays * checkpoints[2])),
        summary: namesFrom(phases[2], 'Core implementation complete'),
      },
      {
        name: 'Milestone 4 (90%)',
        dueDate: addDays(startDate, Math.round(totalDays * checkpoints[3])),
        summary: namesFrom(phases[3], 'Draft report and peer review'),
      },
      {
        name: 'Final Submission (100%)',
        dueDate: addDays(startDate, Math.round(totalDays * checkpoints[4])),
        summary: 'Final report and presentation delivered',
      },
    ];

    // Persist into aiPlanDetails.milestones keeping existing suggestions/itinerary
    const plan = project.aiPlanDetails || {};
    plan.milestones = milestones;
    project.aiPlanDetails = plan;
    await project.save();

    return res.json({ msg: 'Auto milestones generated', milestones, totalDays });
  } catch (err) {
    console.error('Auto milestones error:', err && err.message ? err.message : err);
    return res.status(500).json({ msg: 'Server Error', error: err && err.message ? err.message : String(err) });
  }
});

module.exports = router;
