const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');
const path = require('path');
const fs = require('fs');
const nextcloud = require('../utils/nextcloud');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ensure local upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Helper to upload file to storage (Nextcloud or Local)
 */
async function processFileUpload({ uploadedFile, projectId, taskId, userId }) {
  const localFilePath = path.join(uploadDir, `${Date.now()}_${uploadedFile.name}`);
  await uploadedFile.mv(localFilePath);

  let storageProvider = 'local';
  let nextcloudPath = null;
  let nextcloudUrl = null;

  // Nextcloud upload if configured
  if (nextcloud.isConfigured()) {
    try {
      const buffer = fs.readFileSync(localFilePath);
      const ncResult = await nextcloud.uploadFile(buffer, uploadedFile.name, projectId, uploadedFile.mimetype);
      storageProvider = 'nextcloud';
      nextcloudPath = ncResult.remotePath;
      nextcloudUrl = ncResult.url;
      console.log(`[Files] Successfully stored on Nextcloud: ${nextcloudPath}`);
    } catch (ncErr) {
      console.error('[Files] Nextcloud upload failed, using local disk fallback:', ncErr.message);
    }
  }

  const newFile = new File({
    project: projectId,
    task: taskId || null,
    fileName: uploadedFile.name,
    filePath: localFilePath,
    fileType: uploadedFile.mimetype,
    uploadedBy: userId,
    storageProvider,
    nextcloudPath,
    nextcloudUrl,
  });

  return await newFile.save();
}

// @route   POST api/files/upload/:projectId
// @desc    Upload a file for a project (stored on Nextcloud if configured)
// @access  Private
router.post('/upload/:projectId', auth, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ msg: 'No files were uploaded.' });
    }

    const { projectId } = req.params;
    const uploadedFile = req.files.file;

    const savedFile = await processFileUpload({
      uploadedFile,
      projectId,
      taskId: null,
      userId: req.user.id,
    });

    res.json(savedFile);
  } catch (err) {
    console.error('Error uploading file:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   POST api/files/upload/:projectId/:taskId
// @desc    Upload a file for a specific task within a project
// @access  Private
router.post('/upload/:projectId/:taskId', auth, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ msg: 'No files were uploaded.' });
    }

    const { projectId, taskId } = req.params;
    const uploadedFile = req.files.file;

    const savedFile = await processFileUpload({
      uploadedFile,
      projectId,
      taskId,
      userId: req.user.id,
    });

    res.json(savedFile);
  } catch (err) {
    console.error('Error uploading file:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   GET api/files/project/:projectId
// @desc    Get all files for a project
// @access  Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const files = await File.find({ project: req.params.projectId }).populate('uploadedBy', 'username');
    res.json(files);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   GET api/files/download/:fileId
// @desc    Download a file from Nextcloud or local disk
// @access  Private
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.fileType) {
      res.setHeader('Content-Type', file.fileType);
    }

    // Attempt Nextcloud download first if stored on Nextcloud
    if (file.storageProvider === 'nextcloud' && file.nextcloudPath && nextcloud.isConfigured()) {
      try {
        const fileBuffer = await nextcloud.downloadFile(file.nextcloudPath);
        return res.send(fileBuffer);
      } catch (ncErr) {
        console.error('[Files] Error downloading from Nextcloud, trying local fallback:', ncErr.message);
      }
    }

    // Local disk fallback
    if (file.filePath && fs.existsSync(file.filePath)) {
      return res.sendFile(path.resolve(file.filePath));
    }

    return res.status(404).json({ msg: 'File content not found on server or Nextcloud' });
  } catch (err) {
    console.error('Error downloading file:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   POST api/files/:fileId/ai-organise
// @desc    Get AI-suggested tags/categories for a file
// @access  Private
router.post('/:fileId/ai-organise', auth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    const prompt = `Given a file named "${file.fileName}" of type "${file.fileType}", suggest 3-5 relevant tags or categories. Format the output as a JSON array of strings. For example: ["report", "finance", "Q3"].`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    let aiSuggestedTags;
    try {
      aiSuggestedTags = JSON.parse(text);
      if (!Array.isArray(aiSuggestedTags)) {
        throw new Error("AI response is not an array.");
      }
    } catch (parseError) {
      console.error('Error parsing AI response for file organization:', parseError);
      console.error('AI Raw Response:', text);
      aiSuggestedTags = ['Could not generate AI tags at this time.'];
    }

    res.json({ msg: 'AI suggested tags for file', aiSuggestedTags });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

// @route   DELETE api/files/:fileId
// @desc    Delete a file by ID (DB, Nextcloud, and disk)
// @access  Private
router.delete('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Delete from Nextcloud if applicable
    if (file.nextcloudPath && nextcloud.isConfigured()) {
      await nextcloud.deleteFile(file.nextcloudPath);
    }

    // Delete physical file locally if it exists
    try {
      if (file.filePath && fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
    } catch (fsErr) {
      console.warn('Failed to remove file from disk:', fsErr.message);
    }

    await file.deleteOne();
    return res.json({ msg: 'File deleted successfully' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server Error', error: err ? err.message : 'Unknown error' });
  }
});

module.exports = router;
