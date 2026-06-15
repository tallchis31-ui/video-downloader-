const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');

// Get video info (title, duration, available formats/qualities)
router.post('/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Use yt-dlp to get video info
    try {
      const command = `yt-dlp -j --no-warnings "${url}"`;
      const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      const videoInfo = JSON.parse(output);

      // Extract relevant information
      const info = {
        title: videoInfo.title || 'Unknown',
        duration: videoInfo.duration || 0,
        thumbnail: videoInfo.thumbnail || '',
        uploader: videoInfo.uploader || 'Unknown',
        platforms: detectPlatform(url),
        formats: extractFormats(videoInfo.formats || [])
      };

      res.json(info);
    } catch (error) {
      console.error('yt-dlp error:', error.message);
      res.status(400).json({ 
        error: 'Could not retrieve video info',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Info endpoint error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper: Validate URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper: Detect platform
function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'YouTube';
  if (urlLower.includes('tiktok.com')) return 'TikTok';
  if (urlLower.includes('instagram.com')) return 'Instagram';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter/X';
  if (urlLower.includes('vimeo.com')) return 'Vimeo';
  if (urlLower.includes('facebook.com')) return 'Facebook';
  if (urlLower.includes('twitch.tv')) return 'Twitch';
  if (urlLower.includes('reddit.com')) return 'Reddit';
  return 'Unknown Platform';
}

// Helper: Extract available formats
function extractFormats(formats) {
  const qualityMap = {};

  formats.forEach(format => {
    if (format.height) {
      const quality = `${format.height}p`;
      if (!qualityMap[quality]) {
        qualityMap[quality] = {
          quality,
          format_id: format.format_id,
          ext: format.ext,
          filesize: format.filesize
        };
      }
    }
  });

  return Object.values(qualityMap)
    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
    .slice(0, 6); // Return top 6 qualities
}

module.exports = router;
