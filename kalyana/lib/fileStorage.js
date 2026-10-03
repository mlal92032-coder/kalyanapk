import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function generateFileName(originalName) {
  const ext = path.extname(originalName);
  const name = crypto.randomBytes(16).toString("hex");
  return `${name}${ext}`;
}

export function saveBase64Image(base64Data, originalName = "image.jpg") {
  try {
    // Remove data URI prefix if present
    let data = base64Data;
    if (base64Data.includes(",")) {
      data = base64Data.split(",")[1];
    }

    const buffer = Buffer.from(data, "base64");
    const fileName = generateFileName(originalName);
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("[FileStorage] Error saving image:", error.message);
    throw new Error(`Failed to save image: ${error.message}`);
  }
}

export function deleteImage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
      return false;
    }

    const fileName = path.basename(imageUrl);
    const filePath = path.join(UPLOAD_DIR, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("[FileStorage] Error deleting image:", error.message);
    return false;
  }
}

export function isBase64(str) {
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch (err) {
    return false;
  }
}
