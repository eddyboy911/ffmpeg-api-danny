const express = require('express');
const router = express.Router();
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Upload config
const upload = multer({ dest: 'uploads/' });

// POST /video/stitch
router.post('/stitch', upload.array('videos', 3), async (req, res) => {
  try {
    const files = req.files.map(file => file.path);
    const outputPath = `output/stitch-${Date.now()}.mp4`;

    // Create concat file for ffmpeg
    const concatFile = `uploads/concat-list-${Date.now()}.txt`;
    const concatContent = files.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(concatFile, concatContent);

    ffmpeg()
      .input(concatFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions('-c copy')
      .on('end', () => {
        res.download(outputPath, () => {
          fs.unlinkSync(outputPath);
          fs.unlinkSync(concatFile);
          files.forEach(f => fs.unlinkSync(f));
        });
      })
      .on('error', err => {
        console.error(err);
        res.status(500).send('Error stitching video');
      })
      .save(outputPath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
