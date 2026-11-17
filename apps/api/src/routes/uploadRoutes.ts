import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../utils/AppError.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(currentDirectory, "../../uploads");

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new AppError(400, "Only image files can be uploaded"));
      return;
    }
    callback(null, true);
  },
});

const router = Router();

router.post("/", requireAuth, upload.single("image"), (request, response) => {
  if (!request.file) throw new AppError(400, "Choose an image to upload");
  response.status(201).json({
    data: {
      url: `/uploads/${request.file.filename}`,
      name: request.file.originalname,
      size: request.file.size,
    },
  });
});

export default router;
