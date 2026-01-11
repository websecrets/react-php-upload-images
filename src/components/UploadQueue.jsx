import React from "react";
import PropTypes from "prop-types";
import "./UploadQueue.css";

/**
 * Upload Queue Component
 * Displays list of files being uploaded with individual progress and cancel options
 */
const UploadQueue = ({ uploadItems, onCancel }) => {
  if (uploadItems.length === 0) {
    return null;
  }

  /**
   * Get status color based on upload status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case "uploading":
        return "#3498db";
      case "success":
        return "#27ae60";
      case "failed":
        return "#e74c3c";
      case "canceled":
        return "#95a5a6";
      default:
        return "#bdc3c7";
    }
  };

  /**
   * Get status text in Arabic
   */
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "في الانتظار";
      case "uploading":
        return "جاري الرفع";
      case "success":
        return "تم بنجاح";
      case "failed":
        return "فشل";
      case "canceled":
        return "تم الإلغاء";
      default:
        return status;
    }
  };

  /**
   * Get progress bar color
   */
  const getProgressColor = (progress) => {
    if (progress < 30) return "#ff6b6b";
    if (progress < 70) return "#ffd93d";
    return "#6bcf7f";
  };

  /**
   * Format file size
   */
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="upload-queue">
      <h3 className="queue-header">
        <span>📋 قائمة الرفع</span>
        <span className="queue-count">{uploadItems.length} ملف</span>
      </h3>

      <div className="queue-items">
        {uploadItems.map((item) => (
          <div key={item.id} className={`queue-item status-${item.status}`}>
            {/* Preview Thumbnail */}
            {item.preview && (
              <div className="item-preview">
                <img src={item.preview} alt={item.file.name} />
              </div>
            )}

            {/* File Info */}
            <div className="item-info">
              <div className="item-name" title={item.file.name}>
                {item.file.name}
              </div>
              <div className="item-size">{formatSize(item.file.size)}</div>
            </div>

            {/* Status Badge */}
            <div
              className="item-status-badge"
              style={{ backgroundColor: getStatusColor(item.status) }}
            >
              {getStatusText(item.status)}
            </div>

            {/* Progress Bar (only during upload) */}
            {item.status === "uploading" && (
              <div className="item-progress">
                <div
                  className="item-progress-fill"
                  style={{
                    width: `${item.progress}%`,
                    backgroundColor: getProgressColor(item.progress),
                  }}
                />
                <span className="item-progress-text">{item.progress}%</span>
              </div>
            )}

            {/* Error Message */}
            {item.status === "failed" && item.error && (
              <div className="item-error">{item.error}</div>
            )}

            {/* Cancel Button (only during upload) */}
            {item.status === "uploading" && (
              <button
                className="item-cancel-btn"
                onClick={() => onCancel(item.id)}
                title="إلغاء الرفع"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

UploadQueue.propTypes = {
  uploadItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      file: PropTypes.object.isRequired,
      preview: PropTypes.string,
      progress: PropTypes.number,
      status: PropTypes.string.isRequired,
      error: PropTypes.string,
    })
  ).isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default UploadQueue;
