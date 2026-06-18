const express = require('express');
const router = express.Router();
const { upload, uploadLarge, uploadMedium, uploadDocument, uploadCompanyDoc, uploadToS3, getPublicFileUrl } = require('../utils/s3Upload');
const { protect, admin } = require('../middlewares/auth');

// @desc    Upload single file (image, STL, document)
// @route   POST /api/upload/single
// @access  Private
router.post('/single', protect, async (req, res) => {
  try {
    // Get file type from query or body (after multer processes it)
    const fileType = req.query.type || 'image';
    const folder = req.query.folder;
    let uploadMiddleware;
    
    // CAD files (stl, step, stp, etc.) use large upload
    const cadTypes = ['stl', 'step', 'stp', 'iges', 'obj', 'cad', '3mf', 'dxf', 'dwg'];
    if (cadTypes.includes(fileType)) {
      uploadMiddleware = uploadLarge.single('file');
    } else if (folder === 'company-documents') {
      uploadMiddleware = uploadCompanyDoc.single('file');
    } else if (fileType === 'document') {
      uploadMiddleware = uploadDocument.single('file');
    } else if (fileType === 'extra') {
      uploadMiddleware = uploadMedium.single('file');
    } else {
      uploadMiddleware = upload.single('file');
    }

    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: err.message || 'File upload failed' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Determine folder based on file type (from query or body after multer)
      const finalFileType = req.body.type || req.query.type || fileType;
      let folder = req.query.folder || req.body.folder;
      if (!folder) {
        if (cadTypes.includes(finalFileType)) {
          folder = 'cad-files';
        } else if (finalFileType === 'document') {
          folder = 'documents';
        } else {
          folder = 'images';
        }
      }

      try {
        const s3Key = await uploadToS3(req.file, folder);
        const publicUrl = getPublicFileUrl(s3Key);

        res.json({
          success: true,
          message: 'File uploaded successfully',
          data: {
            url: publicUrl,
            key: s3Key,
            size: req.file.size,
            mimetype: req.file.mimetype
          },
          url: publicUrl
        });
      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        res.status(500).json({ message: 'Error uploading to S3', error: s3Error.message });
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private
router.post('/multiple', protect, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const folder = req.query.folder || req.body.folder || 'images';
    const uploadedFiles = [];

    for (const file of req.files) {
      const s3Key = await uploadToS3(file, folder);
      uploadedFiles.push({
        url: getPublicFileUrl(s3Key),
        key: s3Key,
        size: file.size,
        mimetype: file.mimetype
      });
    }

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      urls: uploadedFiles.map(file => file.url)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading files', error: error.message });
  }
});

// @desc    Upload product images
// @route   POST /api/upload/product
// @access  Private/Admin
router.post('/product', protect, admin, (req, res, next) => {
  req.uploadFolder = 'products';
  next();
}, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = req.files.map(file => getPublicFileUrl(file.key));
    
    res.json({
      message: 'Product images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading product images' });
  }
});

// @desc    Upload category image
// @route   POST /api/upload/category
// @access  Private/Admin
router.post('/category', protect, admin, (req, res, next) => {
  req.uploadFolder = 'categories';
  next();
}, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const publicUrl = getPublicFileUrl(req.file.key);
    
    res.json({
      message: 'Category image uploaded successfully',
      image: publicUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading category image' });
  }
});

// @desc    Upload type logo
// @route   POST /api/upload/type
// @access  Private/Admin
router.post('/type', protect, admin, (req, res, next) => {
  req.uploadFolder = 'types';
  next();
}, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const publicUrl = getPublicFileUrl(req.file.key);
    
    res.json({
      message: 'type logo uploaded successfully',
      logo: publicUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading type logo' });
  }
});

module.exports = router;