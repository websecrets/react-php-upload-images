import React from "react";
import ImageUploader from "./ImageUploader";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🖼️ نظام رفع الصور الاحترافي</h1>
        <p>رفع آمن وسريع للصور مع عرض التقدم الفعلي</p>
      </header>
      <main className="app-main">
        <ImageUploader />
      </main>
      <footer className="app-footer">
        <p>نظام رفع الصور | React.js + PHP | 2026</p>
      </footer>
    </div>
  );
}

export default App;
