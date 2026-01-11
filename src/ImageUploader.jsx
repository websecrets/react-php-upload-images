import React, { useState } from "react";
import axios from "axios";
import UploadQueue from "./components/UploadQueue";
import "./ImageUploader.css";

const ImageUploader = () => {
  // State Management
  const [uploadItems, setUploadItems] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  // PHP Backend URL
  const UPLOAD_URL = "http://localhost/uploadimage/backend/upload.php";

  /**
   * Generate unique ID for upload items
   */
  const generateId = () => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Handle Multiple File Selection
   */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Validate and create upload items
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    const newItems = files
      .filter((file) => {
        // Validate type
        if (!validTypes.includes(file.type)) {
          setMessage({
            text: `${file.name}: نوع غير مسموح`,
            type: "error",
          });
          return false;
        }

        // Validate size
        if (file.size > maxSize) {
          setMessage({
            text: `${file.name}: حجم كبير جداً (max 2MB)`,
            type: "error",
          });
          return false;
        }

        return true;
      })
      .map((file) => {
        const id = generateId();

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, preview: reader.result } : item
            )
          );
        };
        reader.readAsDataURL(file);

        return {
          id,
          file,
          preview: null,
          progress: 0,
          status: "pending",
          controller: new AbortController(),
          error: null,
          result: null,
        };
      });

    setUploadItems((prev) => [...prev, ...newItems]);
    setMessage({ text: "", type: "" });

    // Start uploading automatically - pass item data directly
    setTimeout(() => {
      newItems.forEach((item) => uploadFile(item));
    }, 500);
  };

  /**
   * Upload Single File
   */
  const uploadFile = async (item) => {
    if (!item || !item.file) return;

    const itemId = item.id;

    // Update status to uploading
    setUploadItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, status: "uploading", progress: 0 } : i
      )
    );

    const formData = new FormData();
    formData.append("image", item.file);

    try {
      const response = await axios.post(UPLOAD_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal: item.controller.signal,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, progress: percentCompleted } : i
            )
          );
        },
      });

      // Handle success
      if (response.data.success) {
        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: "success",
                  result: response.data.data,
                  progress: 100,
                }
              : i
          )
        );
      } else {
        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, status: "failed", error: response.data.message }
              : i
          )
        );
      }
    } catch (error) {
      // Handle errors
      if (axios.isCancel(error)) {
        // Upload was canceled
        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, status: "canceled", progress: 0 } : i
          )
        );
      } else {
        let errorMessage = "حدث خطأ أثناء الرفع";

        if (error.response) {
          errorMessage = error.response.data.message || errorMessage;
        } else if (error.request) {
          errorMessage = "تعذر الاتصال بالسيرفر";
        }

        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, status: "failed", error: errorMessage }
              : i
          )
        );
      }
    }
  };

  /**
   * Cancel Upload
   */
  const handleCancelUpload = (itemId) => {
    const item = uploadItems.find((i) => i.id === itemId);
    if (item && item.controller) {
      item.controller.abort();
    }
  };

  /**
   * Reset All
   */
  const handleReset = () => {
    // Cancel any ongoing uploads
    uploadItems.forEach((item) => {
      if (item.status === "uploading" && item.controller) {
        item.controller.abort();
      }
    });

    setUploadItems([]);
    setMessage({ text: "", type: "" });
    document.getElementById("fileInput").value = "";
  };

  return (
    <div className="uploader-container">
      <div className="uploader-card">
        <div className="uploader-header">
          <h2>📤 رفع صور متعددة</h2>
        </div>

        <div className="uploader-body">
          {/* File Input Section */}
          <div className="file-input-section">
            <label htmlFor="fileInput" className="file-label">
              <span className="file-icon">🖼️</span>
              <span className="file-text">اختر صورة أو عدة صور للرفع</span>
              <span className="file-hint">
                (JPG, PNG, WEBP - حد أقصى 2MB لكل صورة)
              </span>
            </label>
            <input
              type="file"
              id="fileInput"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              multiple
            />
          </div>

          {/* Upload Queue */}
          <UploadQueue
            uploadItems={uploadItems}
            onCancel={handleCancelUpload}
          />

          {/* Messages */}
          {message.text && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Reset Button */}
          {uploadItems.length > 0 && (
            <button className="reset-button" onClick={handleReset}>
              🔄 إعادة تعيين الكل
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
