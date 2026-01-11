import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "./Lightbox.css";

/**
 * Lightbox Component
 * Modal for viewing large images
 */
const Lightbox = ({ image, onClose }) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  if (!image) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="lightbox-close"
          onClick={onClose}
          title="إغلاق (ESC)"
        >
          ✕
        </button>

        <div className="lightbox-image-container">
          <img
            src={`http://localhost${image.large}`}
            alt={image.id}
            className="lightbox-image"
          />
        </div>

        <div className="lightbox-info">
          <div className="lightbox-info-item">
            <strong>الأبعاد الأصلية:</strong> {image.dimensions.original}
          </div>
          <div className="lightbox-info-item">
            <strong>الحجم:</strong> {(image.size / 1024).toFixed(2)} KB
          </div>
          <div className="lightbox-info-item">
            <strong>النوع:</strong> {image.type}
          </div>
        </div>

        <div className="lightbox-actions">
          <a
            href={`http://localhost${image.original}`}
            target="_blank"
            rel="noopener noreferrer"
            className="lightbox-btn lightbox-btn-view"
          >
            📂 عرض الأصلية
          </a>
          <a
            href={`http://localhost${image.original}`}
            download
            className="lightbox-btn lightbox-btn-download"
          >
            ⬇️ تحميل
          </a>
        </div>
      </div>
    </div>
  );
};

Lightbox.propTypes = {
  image: PropTypes.shape({
    id: PropTypes.string.isRequired,
    original: PropTypes.string.isRequired,
    large: PropTypes.string.isRequired,
    thumb: PropTypes.string.isRequired,
    dimensions: PropTypes.object.isRequired,
    size: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
};

export default Lightbox;
