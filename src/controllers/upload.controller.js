const s3Service = require('../services/s3.service');
const { success } = require('../utils/response');
const { BadRequestError } = require('../utils/errors');

// POST /api/upload/image
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No image file provided');
    }

    const result = await s3Service.uploadFile(req.file);

    return success(res, { url: result.url, key: result.key }, 'Image uploaded', 201);
  } catch (err) {
    next(err);
  }
};
