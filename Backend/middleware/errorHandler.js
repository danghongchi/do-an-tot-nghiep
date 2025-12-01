const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      message: 'File quá lớn. Kích thước tối đa là 10MB' 
    });
  }

  if (err.message === 'Chỉ cho phép file PDF, JPG, JPEG, PNG') {
    return res.status(400).json({ 
      message: err.message 
    });
  }

  // Default error
  res.status(500).json({ 
    message: 'Có lỗi xảy ra trên server' 
  });
};

module.exports = errorHandler;

