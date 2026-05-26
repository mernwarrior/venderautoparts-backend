export const validate = (schema) => (req, res, next) => {
  const files = {};

  // ✅ Multipart files handle (multer .fields())
  if (req.files && typeof req.files === "object" && !Array.isArray(req.files)) {
    Object.keys(req.files).forEach((key) => {
      const f = req.files[key];
      if (Array.isArray(f) && f.length > 0) {
        files[key] = f[0]?.filename || f[0]?.path || "uploaded";
      }
    });
  }

  // ✅ Single file handle (multer .single())
  if (req.file) {
    files[req.file.fieldname] = req.file.filename || req.file.path || "uploaded";
  }

  const payload = { ...req.body, ...files };

  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,   // extra keys silently remove
  });

  if (error) {
    return res.status(400).json({
      success: false,
     message: error.details[0].message.replace(/['"]/g, ""),
    });
  }

  // ✅ Cleaned data set karo — controller mein req.body clean milega
  req.body = value;
  next();
};