import sharp from 'sharp';

const OUTPUT_PRESETS = Object.freeze({
  profile: Object.freeze({
    width: 512,
    height: 512,
    quality: 80,
    maxInputPixels: 64_000_000,
  }),
  article: Object.freeze({
    width: 1920,
    height: 1920,
    quality: 82,
    maxInputPixels: 64_000_000,
  }),
});

const invalidImageError = () => {
  const error = new Error('Invalid image data. The uploaded file could not be processed.');
  error.status = 400;
  return error;
};

export const prepareImageForStorage = async (buffer, mimetype, presetName) => {
  if (!Buffer.isBuffer(buffer)) {
    throw invalidImageError();
  }

  if (mimetype === 'image/gif') {
    return {
      buffer,
      contentType: 'image/gif',
      extension: '.gif',
      optimized: false,
    };
  }

  const preset = OUTPUT_PRESETS[presetName];
  if (!preset) {
    throw new TypeError(`Unknown image output preset: ${presetName}`);
  }

  try {
    const { data, info } = await sharp(buffer, {
      failOn: 'warning',
      limitInputPixels: preset.maxInputPixels,
    })
      .autoOrient()
      .resize({
        width: preset.width,
        height: preset.height,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: preset.quality,
        smartSubsample: true,
        effort: 4,
      })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      contentType: 'image/webp',
      extension: '.webp',
      optimized: true,
      width: info.width,
      height: info.height,
    };
  } catch {
    throw invalidImageError();
  }
};
