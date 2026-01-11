import React from "react";
import PropTypes from "prop-types";
import "./ImageGallery.css";

/**
 * Image Gallery Component
 * Displays successfully uploaded images with thumbnails
 */
const ImageGallery = ({ images, onImageClick, onRemove }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="image-gallery">
      <h3 className="gallery-header">
        <span>🖼️ الصور المرفوعة</span>
        <span className="gallery-count">{images.length} صورة</span>
      </h3>

      <div className="gallery-grid">
        {images.map((image) => (
          <div key={image.id} className="gallery-item">
            <div
              className="gallery-item-image"
              onClick={() => onImageClick(image)}
              title="انقر للعرض بحجم أكبر"
            >
              <img
                src={`http://localhost${image.thumb}`}
                alt={image.id}
                loading="lazy"
              />
              <div className="gallery-item-overlay">
                <span className="zoom-icon">🔍</span>
              </div>
            </div>

            <div className="gallery-item-info">
              <div className="gallery-item-dimensions">
                {image.dimensions.original}
              </div>
              {onRemove && (
                <button
                  className="gallery-item-remove"
                  onClick={() => onRemove(image.id)}
                  title="حذف"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      thumb: PropTypes.string.isRequired,
      large: PropTypes.string.isRequired,
      original: PropTypes.string.isRequired,
      dimensions: PropTypes.object,
    })
  ).isRequired,
  onImageClick: PropTypes.func.isRequired,
  onRemove: PropTypes.func,
};

export default ImageGallery;
