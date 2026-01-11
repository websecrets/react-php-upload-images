<?php
/**
 * ImageProcessor Class
 * Handles image manipulation using GD library
 * Creates thumbnails and optimized versions
 * All output images are saved as WebP format
 */

class ImageProcessor {
    
    /**
     * Create a center-cropped square thumbnail (WebP output)
     * 
     * @param string $sourcePath Path to source image
     * @param string $destPath Path to save thumbnail (will be .webp)
     * @param int $size Thumbnail size (default 300x300)
     * @return bool Success status
     */
    public static function createThumbnail($sourcePath, $destPath, $size = 300) {
        try {
            // Get image info
            $imageInfo = getimagesize($sourcePath);
            if (!$imageInfo) {
                return false;
            }

            list($srcWidth, $srcHeight, $imageType) = $imageInfo;

            // Load source image based on type
            $sourceImage = self::loadImage($sourcePath, $imageType);
            if (!$sourceImage) {
                return false;
            }

            // Calculate crop dimensions (center crop)
            $cropSize = min($srcWidth, $srcHeight);
            $srcX = ($srcWidth - $cropSize) / 2;
            $srcY = ($srcHeight - $cropSize) / 2;

            // Create square thumbnail canvas
            $thumbnail = imagecreatetruecolor($size, $size);
            
            // Preserve transparency for WebP
            imagealphablending($thumbnail, false);
            imagesavealpha($thumbnail, true);
            $transparent = imagecolorallocatealpha($thumbnail, 0, 0, 0, 127);
            imagefill($thumbnail, 0, 0, $transparent);

            // Resample and crop to square
            imagecopyresampled(
                $thumbnail, $sourceImage,
                0, 0, $srcX, $srcY,
                $size, $size, $cropSize, $cropSize
            );

            // Save thumbnail as WebP (always)
            $result = imagewebp($thumbnail, $destPath, 85);

            // Free memory
            imagedestroy($thumbnail);
            imagedestroy($sourceImage);

            return $result;
        } catch (Exception $e) {
            error_log("Thumbnail creation failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a large version with proportional resize (WebP output)
     * 
     * @param string $sourcePath Path to source image
     * @param string $destPath Path to save large version (will be .webp)
     * @param int $maxWidth Maximum width (default 1600px)
     * @return bool Success status
     */
    public static function createLargeVersion($sourcePath, $destPath, $maxWidth = 1600) {
        try {
            // Get image info
            $imageInfo = getimagesize($sourcePath);
            if (!$imageInfo) {
                return false;
            }

            list($srcWidth, $srcHeight, $imageType) = $imageInfo;

            // Load source image
            $sourceImage = self::loadImage($sourcePath, $imageType);
            if (!$sourceImage) {
                return false;
            }

            // If image is smaller than max width, still convert to WebP
            if ($srcWidth <= $maxWidth) {
                $result = imagewebp($sourceImage, $destPath, 90);
                imagedestroy($sourceImage);
                return $result;
            }

            // Calculate new dimensions (maintain aspect ratio)
            $ratio = $maxWidth / $srcWidth;
            $newWidth = $maxWidth;
            $newHeight = (int)($srcHeight * $ratio);

            // Create new image canvas
            $largeImage = imagecreatetruecolor($newWidth, $newHeight);

            // Preserve transparency
            imagealphablending($largeImage, false);
            imagesavealpha($largeImage, true);
            $transparent = imagecolorallocatealpha($largeImage, 0, 0, 0, 127);
            imagefill($largeImage, 0, 0, $transparent);

            // Resize image proportionally
            imagecopyresampled(
                $largeImage, $sourceImage,
                0, 0, 0, 0,
                $newWidth, $newHeight, $srcWidth, $srcHeight
            );

            // Save large version as WebP (always)
            $result = imagewebp($largeImage, $destPath, 90);

            // Free memory
            imagedestroy($largeImage);
            imagedestroy($sourceImage);

            return $result;
        } catch (Exception $e) {
            error_log("Large version creation failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Convert original image to WebP
     * 
     * @param string $sourcePath Path to source image
     * @param string $destPath Path to save WebP version
     * @return bool Success status
     */
    public static function convertToWebP($sourcePath, $destPath) {
        try {
            $imageInfo = getimagesize($sourcePath);
            if (!$imageInfo) {
                return false;
            }

            list($srcWidth, $srcHeight, $imageType) = $imageInfo;

            // Load source image
            $sourceImage = self::loadImage($sourcePath, $imageType);
            if (!$sourceImage) {
                return false;
            }

            // Save as WebP with high quality
            $result = imagewebp($sourceImage, $destPath, 95);

            // Free memory
            imagedestroy($sourceImage);

            return $result;
        } catch (Exception $e) {
            error_log("WebP conversion failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Load image from file based on type
     * 
     * @param string $path Image file path
     * @param int $imageType Image type constant
     * @return resource|false Image resource or false
     */
    private static function loadImage($path, $imageType) {
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                return @imagecreatefromjpeg($path);
            case IMAGETYPE_PNG:
                return @imagecreatefrompng($path);
            case IMAGETYPE_WEBP:
                return @imagecreatefromwebp($path);
            default:
                return false;
        }
    }

    /**
     * Check if GD library is available
     * 
     * @return bool
     */
    public static function isGDAvailable() {
        return extension_loaded('gd') && function_exists('gd_info');
    }

    /**
     * Get image dimensions
     * 
     * @param string $path Image path
     * @return array|false ['width' => x, 'height' => y] or false
     */
    public static function getImageDimensions($path) {
        $imageInfo = @getimagesize($path);
        if (!$imageInfo) {
            return false;
        }
        
        return [
            'width' => $imageInfo[0],
            'height' => $imageInfo[1]
        ];
    }
}
?>
