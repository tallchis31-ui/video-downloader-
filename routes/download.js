const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Download video
router.post('/download', async (req, res) => {
  const tempDir = path.join(os.tmpdir(), 'video-downloads');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    const { url, quality, format } = req.body;

    // Validation
    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!format || !['mp4', 'mp3'].includes(format)) {
      return res.status(400).json({ error: 'Format must be mp4 or mp3' });
    }

    console.log(`📥 Downloading: ${url} | Format: ${format} | Quality: ${quality}`);

    // Build yt-dlp command
    let command = `yt-dlp -f "best" --no-warnings -o "${tempDir}/%(title)s.%(ext)s"`;

    if (format === 'mp3') {
      // Audio only
      command = `yt-dlp -x --audio-format mp3 --audio-quality 192K --no-warnings -o "${tempDir}/%(title)s.%(ext)s" "${url}"`;
    } else if (format === 'mp4' && quality) {
      // Video with specific quality
      command = `yt-dlp -f "best[height<=${quality}]/best" --merge-output-format mp4 --no-warnings -o "${tempDir}/%(title)s.%(ext)s" "${url}"`;
    } else {
      // Default best quality
      command = `yt-dlp -f "best" --merge-output-format mp4 --no-warnings -o "${tempDir}/%(title)s.%(ext)s" "${url}"`;
    }

    // Execute download
    try {
      const output = execSync(command, { 
        encoding: 'utf-8', 
        maxBuffer: 10 * 1024 * 1024,
        timeout: 300000 // 5 minute timeout
      });

      console.log('Download output:', output);

      // Find the downloaded file
      const files = fs.readdirSync(tempDir);
      const latestFile = files
        .map(file => ({
          name: file,
          time: fs.statSync(path.join(tempDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)[0];

      if (!latestFile) {
        return res.status(500).json({ error: 'File not found after download' });
      }

      const filePath = path.join(tempDir, latestFile.name);
      const fileSize = fs.statSync(filePath).size;

      console.log(`✅ Download complete: ${latestFile.name} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

      // Send file
      res.download(filePath, latestFile.name, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        
        // Clean up file after download
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`🗑️  Deleted: ${latestFile.name}`);
            }
          } catch (e) {
            console.error('Cleanup error:', e);
          }
        }, 5000);
      });

    } catch (error) {
      console.error('yt-dlp execution error:', error.message);
      res.status(400).json({ 
        error: 'Download failed',
        details: error.message.includes('Video unavailable') 
          ? 'Video is unavailable or restricted' 
          : 'Could not download this video'
      });
    }

  } catch (error) {
    console.error('Download route error:', error);
    res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
