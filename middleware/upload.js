const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const baseUploadDir = path.join(__dirname, '../uploads/products');
const thumbnailDir = path.join(baseUploadDir, 'thumbnails');
const galleryDir = path.join(baseUploadDir, 'gallery');
const filesDir = path.join(baseUploadDir, 'files');

// Create directories if they don't exist
[baseUploadDir, thumbnailDir, galleryDir, filesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage with dynamic destination based on field name
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = baseUploadDir;

        // Determine folder based on field name
        if (file.fieldname === 'thumbnail_image') {
            uploadPath = thumbnailDir;
        } else if (file.fieldname === 'gallery_images') {
            uploadPath = galleryDir;
        } else if (file.fieldname === 'main_file') {
            uploadPath = filesDir;
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images and certain file types
const fileFilter = (req, file, cb) => {
    // Log for debugging
    console.log(`Processing upload - File: ${file.originalname}, MIME: ${file.mimetype}`);

    // Allowed extensions
    const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|zip|rar|7z|tar|gz|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase().replace('.', ''));

    // Allowed mime types (expanded list)
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip',
        'application/x-rar-compressed', 'application/x-rar', 'application/vnd.rar',
        'application/x-7z-compressed',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream' // Often sent for zips/rars on Windows
    ];

    const mimetype = file.mimetype.startsWith('image/') || allowedMimes.includes(file.mimetype);

    // Be more lenient: if extname is valid AND mimetype is application/octet-stream (common fallback), allow it
    // Or if mimetype is explicitly allowed
    if (extname && (mimetype || file.mimetype === 'application/octet-stream')) {
        return cb(null, true);
    } else {
        console.error(`File rejected - File: ${file.originalname}, MIME: ${file.mimetype}`);
        cb(new Error(`File type not allowed! Got: ${file.mimetype}`));
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    fileFilter: fileFilter
});

// Export different upload configurations
module.exports = {
    // Single file upload
    uploadSingle: upload.single('file'),

    // Multiple files for product
    uploadProductFiles: upload.fields([
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'gallery_images', maxCount: 10 },
        { name: 'main_file', maxCount: 1 }
    ]),

    // Multiple images only
    uploadMultipleImages: upload.array('images', 10)
};
