const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  version: {
    type: Number,
    default: 1,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  storageProvider: {
    type: String,
    enum: ['local', 'nextcloud'],
    default: 'local',
  },
  nextcloudPath: {
    type: String,
  },
  nextcloudUrl: {
    type: String,
  },
});

module.exports = mongoose.model('File', FileSchema);
