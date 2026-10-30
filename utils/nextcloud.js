const path = require('path');

/**
 * Nextcloud WebDAV Storage Utility
 * Connects to Nextcloud via WebDAV protocol for file storage operations.
 */
class NextcloudService {
  constructor() {
    this.reloadConfig();
  }

  reloadConfig() {
    this.url = process.env.NEXTCLOUD_URL ? process.env.NEXTCLOUD_URL.replace(/\/$/, '') : '';
    this.user = process.env.NEXTCLOUD_USER || '';
    this.password = process.env.NEXTCLOUD_PASSWORD || '';
    this.uploadDir = process.env.NEXTCLOUD_UPLOAD_DIR || 'acad_ai_uploads';
  }

  /**
   * Check if Nextcloud credentials are properly configured
   */
  isConfigured() {
    this.reloadConfig();
    return Boolean(this.url && this.user && this.password);
  }

  getAuthHeader() {
    const credentials = Buffer.from(`${this.user}:${this.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  getWebDavBaseUrl(targetUrl = this.url) {
    return `${targetUrl}/remote.php/webdav`;
  }

  /**
   * Perform WebDAV standard HTTP request
   */
  async request(method, relativePath, options = {}) {
    const baseUrl = this.getWebDavBaseUrl();
    const isFolder = relativePath.endsWith('/') || options.isFolder;
    const cleanPath = relativePath
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');
    const fullUrl = `${baseUrl}/${cleanPath}${isFolder ? '/' : ''}`;

    const headers = {
      'Authorization': this.getAuthHeader(),
      ...(options.headers || {})
    };

    const fetchOptions = {
      method,
      headers,
      body: options.body,
    };

    try {
      const res = await fetch(fullUrl, fetchOptions);
      return res;
    } catch (err) {
      // If localhost:8088 failed (e.g. running inside Docker container), try nextcloud container host
      if (this.url.includes('localhost:8088') || this.url.includes('127.0.0.1:8088')) {
        const dockerBaseUrl = this.getWebDavBaseUrl(this.url.replace(/localhost:8088|127\.0\.0\.1:8088/, 'nextcloud:80'));
        const dockerUrl = `${dockerBaseUrl}/${cleanPath}${isFolder ? '/' : ''}`;
        console.log(`[Nextcloud] Host connection failed, retrying via Docker internal network: ${dockerUrl}`);
        try {
          return await fetch(dockerUrl, fetchOptions);
        } catch (_) {
          throw err;
        }
      }
      throw err;
    }
  }

  /**
   * Recursively ensure directory exists on Nextcloud using MKCOL
   */
  async ensureFolder(folderPath) {
    if (!this.isConfigured()) return false;
    
    const parts = folderPath.split('/').filter(Boolean);
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      try {
        const res = await this.request('MKCOL', `${currentPath}/`, { isFolder: true });
        // 201 = Created, 405 = Method Not Allowed (Already Exists), 409 = Conflict, 301 = Redirect
        if (!res.ok && res.status !== 405 && res.status !== 409 && res.status !== 301) {
          console.warn(`[Nextcloud] MKCOL response for ${currentPath}: ${res.status} ${res.statusText}`);
        }
      } catch (err) {
        console.error(`[Nextcloud] Error creating folder ${currentPath}:`, err.message);
      }
    }
  }

  /**
   * Upload file buffer to Nextcloud WebDAV
   * @param {Buffer} buffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} subFolder - Subfolder (e.g. project ID)
   * @param {string} mimeType - MIME type
   */
  async uploadFile(buffer, fileName, subFolder = '', mimeType = 'application/octet-stream') {
    if (!this.isConfigured()) {
      throw new Error('Nextcloud is not configured (missing NEXTCLOUD_URL, NEXTCLOUD_USER, or NEXTCLOUD_PASSWORD).');
    }

    const folderPath = subFolder ? `${this.uploadDir}/${subFolder}` : this.uploadDir;
    await this.ensureFolder(folderPath);

    const relativePath = `${folderPath}/${fileName}`;
    console.log(`[Nextcloud] Uploading file to WebDAV path: ${relativePath}`);

    const res = await this.request('PUT', relativePath, {
      headers: {
        'Content-Type': mimeType,
      },
      body: buffer,
    });

    if (!res.ok && res.status !== 201 && res.status !== 204) {
      const text = await res.text();
      throw new Error(`Nextcloud upload failed (${res.status}): ${text || res.statusText}`);
    }

    const webdavUrl = `${this.getWebDavBaseUrl()}/${folderPath.split('/').filter(Boolean).map(encodeURIComponent).join('/')}/${encodeURIComponent(fileName)}`;

    return {
      success: true,
      remotePath: relativePath,
      url: webdavUrl,
      fileName,
    };
  }

  /**
   * Download file from Nextcloud WebDAV
   * @param {string} relativePath - WebDAV relative path
   */
  async downloadFile(relativePath) {
    if (!this.isConfigured()) {
      throw new Error('Nextcloud is not configured');
    }

    const res = await this.request('GET', relativePath);
    if (!res.ok) {
      throw new Error(`Failed to fetch file from Nextcloud (${res.status} ${res.statusText})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Delete file from Nextcloud WebDAV
   * @param {string} relativePath - WebDAV relative path
   */
  async deleteFile(relativePath) {
    if (!this.isConfigured()) return false;

    try {
      const res = await this.request('DELETE', relativePath);
      if (res.ok || res.status === 204 || res.status === 404) {
        console.log(`[Nextcloud] Deleted remote file: ${relativePath}`);
        return true;
      }
      console.warn(`[Nextcloud] Delete failed with status: ${res.status}`);
      return false;
    } catch (err) {
      console.error('[Nextcloud] Error deleting remote file:', err.message);
      return false;
    }
  }
}

module.exports = new NextcloudService();
