<?php
/**
 * Professional Image Upload Handler
 * Handles secure image uploads with validation and progress tracking
 * Version 2.0 - Multi-version support with thumbnails
 */

// Include ImageProcessor
require_once __DIR__ . '/ImageProcessor.php';

// Enable CORS for React frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed'
    ]);
    exit();
}

// Configuration
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_DIR_ORIGINAL', UPLOAD_DIR . 'original/');
define('UPLOAD_DIR_LARGE', UPLOAD_DIR . 'large/');
define('UPLOAD_DIR_THUMB', UPLOAD_DIR . 'thumb/');
define('MAX_FILE_SIZE', 2 * 1024 * 1024); // 2MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp']);

/**
 * Validate and process uploaded image
 */
function processUpload() {
    // Check if file was uploaded
    if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
        return [
            'success' => false,
            'message' => 'لم يتم اختيار ملف للرفع'
        ];
    }

    $file = $_FILES['image'];

    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'الملف كبير جداً (تجاوز حد PHP)',
            UPLOAD_ERR_FORM_SIZE => 'الملف كبير جداً',
            UPLOAD_ERR_PARTIAL => 'تم رفع الملف جزئياً فقط',
            UPLOAD_ERR_NO_TMP_DIR => 'مجلد الملفات المؤقتة غير موجود',
            UPLOAD_ERR_CANT_WRITE => 'فشل في كتابة الملف على القرص',
            UPLOAD_ERR_EXTENSION => 'امتداد PHP أوقف رفع الملف'
        ];
        
        return [
            'success' => false,
            'message' => $errorMessages[$file['error']] ?? 'حدث خطأ غير معروف أثناء الرفع'
        ];
    }

    // Validate file size
    if ($file['size'] > MAX_FILE_SIZE) {
        return [
            'success' => false,
            'message' => 'حجم الملف يجب أن لا يتجاوز 2 ميجابايت'
        ];
    }

    // Get file extension
    $originalName = $file['name'];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    // Validate extension
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        return [
            'success' => false,
            'message' => 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, WEBP'
        ];
    }

    // Validate MIME type using finfo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, ALLOWED_TYPES)) {
        return [
            'success' => false,
            'message' => 'نوع الملف الفعلي غير صالح. يجب أن يكون صورة حقيقية'
        ];
    }

    // Additional security: verify it's actually an image
    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        return [
            'success' => false,
            'message' => 'الملف ليس صورة صالحة'
        ];
    }

    // Create uploads directories if they don't exist
    $directories = [UPLOAD_DIR, UPLOAD_DIR_ORIGINAL, UPLOAD_DIR_LARGE, UPLOAD_DIR_THUMB];
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true)) {
                return [
                    'success' => false,
                    'message' => 'فشل في إنشاء مجلد الرفع'
                ];
            }
        }
    }
    
    // Create .htaccess for security (if not exists)
    if (!file_exists(UPLOAD_DIR . '.htaccess')) {
        createHtaccess();
    }

    // Generate unique filename with .webp extension (all images saved as WebP)
    $uniqueId = uniqid('img_', true);
    $uniqueName = $uniqueId . '.webp';  // Always use .webp extension
    
    // Define paths for all versions
    $pathOriginal = UPLOAD_DIR_ORIGINAL . $uniqueName;
    $pathLarge = UPLOAD_DIR_LARGE . $uniqueName;
    $pathThumb = UPLOAD_DIR_THUMB . $uniqueName;

    // Check if GD is available
    if (!ImageProcessor::isGDAvailable()) {
        return [
            'success' => false,
            'message' => 'مكتبة GD غير متوفرة على السيرفر'
        ];
    }

    // Convert and save original as WebP
    if (!ImageProcessor::convertToWebP($file['tmp_name'], $pathOriginal)) {
        return [
            'success' => false,
            'message' => 'فشل في تحويل الصورة الأصلية إلى WebP'
        ];
    }

    // Set proper permissions
    chmod($pathOriginal, 0644);

    // Create large version (WebP)
    if (!ImageProcessor::createLargeVersion($pathOriginal, $pathLarge, 1600)) {
        // If failed, copy original as large
        copy($pathOriginal, $pathLarge);
    }

    // Create thumbnail (WebP)
    if (!ImageProcessor::createThumbnail($pathOriginal, $pathThumb, 300)) {
        return [
            'success' => false,
            'message' => 'فشل في إنشاء الصورة المصغرة'
        ];
    }

    // Get dimensions for all versions
    $dimOriginal = ImageProcessor::getImageDimensions($pathOriginal);
    $dimLarge = ImageProcessor::getImageDimensions($pathLarge);
    $dimThumb = ImageProcessor::getImageDimensions($pathThumb);

    // Return success response with all versions (all in WebP format)
    return [
        'success' => true,
        'message' => 'تم رفع الصورة بنجاح وتحويلها إلى WebP!',
        'data' => [
            'id' => $uniqueId,
            'original' => '/backend/uploads/original/' . $uniqueName,
            'large' => '/backend/uploads/large/' . $uniqueName,
            'thumb' => '/backend/uploads/thumb/' . $uniqueName,
            'dimensions' => [
                'original' => $dimOriginal ? $dimOriginal['width'] . 'x' . $dimOriginal['height'] : 'unknown',
                'large' => $dimLarge ? $dimLarge['width'] . 'x' . $dimLarge['height'] : 'unknown',
                'thumb' => $dimThumb ? $dimThumb['width'] . 'x' . $dimThumb['height'] : 'unknown'
            ],
            'size' => $file['size'],
            'type' => 'image/webp',  // All images are now WebP
            'originalType' => $mimeType  // Store original type for reference
        ]
    ];
}

/**
 * Create .htaccess file for security
 */
function createHtaccess() {
    $htaccessContent = <<<'HTACCESS'
# Disable PHP execution in uploads directory
<FilesMatch "\.php$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Allow only image files
<FilesMatch "\.(jpg|jpeg|png|webp)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Disable directory listing
Options -Indexes
HTACCESS;

    file_put_contents(UPLOAD_DIR . '.htaccess', $htaccessContent);
}

// Process the upload and return JSON response
try {
    $result = processUpload();
    http_response_code($result['success'] ? 200 : 400);
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'حدث خطأ في السيرفر: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
