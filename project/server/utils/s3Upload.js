const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const {
  s3Client,
  getBucketName,
  getPublicBaseUrl,
  region,
  isS3WriteEnabled
} = require('../config/aws');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const allowedImageExts = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg'];
  const allowedCADExts = ['.stl', '.step', '.stp', '.iges', '.igs', '.obj', '.3mf', '.dxf', '.dwg', '.pdf'];
  const allowedDocExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.ppt', '.pptx'];

  if (allowedImageExts.includes(fileExt) || allowedCADExts.includes(fileExt) || allowedDocExts.includes(fileExt)) {
    return cb(null, true);
  }
  cb(new Error(`File type "${fileExt}" not allowed!`), false);
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}-${Date.now()}${ext}`);
  }
});

const createUpload = (maxSize = 5 * 1024 * 1024) => multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize }
});

const upload = createUpload(5 * 1024 * 1024);
const uploadLarge = createUpload(150 * 1024 * 1024);
const uploadMedium = createUpload(50 * 1024 * 1024);
const uploadDocument = createUpload(10 * 1024 * 1024);
const uploadCompanyDoc = createUpload(5 * 1024 * 1024);

const getObjectKey = (folder, filename) => {
  const prefix = (process.env.S3_FOLDER_PREFIX || 'enigma').replace(/^\/+|\/+$/g, '');
  const safeFolder = (folder || 'uploads').replace(/^\/+|\/+$/g, '');
  if (!prefix) return `${safeFolder}/${filename}`;
  return `${prefix}/${safeFolder}/${filename}`;
};

const getLocalPublicUrl = (filename) => {
  const base = (process.env.API_URL || `http://localhost:${process.env.PORT || 5005}`).replace(/\/$/, '');
  return `${base}/uploads/${filename}`;
};

const uploadToS3 = async (file, folder) => {
  const filePath = path.join(UPLOADS_DIR, file.filename);
  const key = getObjectKey(folder, file.filename);

  if (isS3WriteEnabled()) {
    try {
      const fileContent = await fs.promises.readFile(filePath);
      const bucket = getBucketName();
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: file.mimetype || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000'
      }));
      await fs.promises.unlink(filePath).catch(() => {});
      console.log(`S3 upload OK: s3://${bucket}/${key}`);
      return key;
    } catch (error) {
      console.error('S3 upload error:', error.name || error.code, error.message);
    }
  }

  // API local storage — file stays in uploads/ (served at API_URL/uploads/)
  return file.filename;
};

const deleteFromS3 = async (fileKey) => {
  try {
    const filePath = path.join(UPLOADS_DIR, path.basename(fileKey));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

const getPublicFileUrl = (storageKey) => {
  if (!storageKey) return storageKey;

  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }

  if (storageKey.includes('/')) {
    return `${getPublicBaseUrl()}/${storageKey}`;
  }

  return getLocalPublicUrl(storageKey);
};

// Backward-compatible alias
const getCloudFrontUrl = getPublicFileUrl;

const extractS3KeyFromUrl = (url) => {
  if (!url) return null;
  const publicBase = getPublicBaseUrl();
  const uploadsPrefix = `${(process.env.API_URL || '').replace(/\/$/, '')}/uploads/`;

  if (url.startsWith(`${publicBase}/`)) {
    return url.replace(`${publicBase}/`, '');
  }
  if (url.startsWith(uploadsPrefix)) {
    return url.replace(uploadsPrefix, '');
  }
  return url.split('/').pop();
};

const getStorageMode = () => (isS3WriteEnabled() ? 's3' : 'local');

module.exports = {
  upload,
  uploadLarge,
  uploadMedium,
  uploadDocument,
  uploadCompanyDoc,
  uploadToS3,
  deleteFromS3,
  getPublicFileUrl,
  getCloudFrontUrl,
  extractS3KeyFromUrl,
  getStorageMode,
  UPLOADS_DIR
};
