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
      // Build command with platform-specific options
      let command = `yt-dlp -j --no-warnings`;
      
      // Add headers for Facebook
      if (url.includes('facebook.com')) {
        command += ` --add-header "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`;
      }
      
      // Add URL
      command += ` "${url}"`;
      
      console.log(`Executing: ${command.substring(0, 100)}...`);
      
      const output = execSync(command, { 
        encoding: 'utf-8', 
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const videoInfo = JSON.parse(output);

      // Extract relevant information
      const info = {
        title: videoInfo.title || 'Unknown',
        duration: videoInfo.duration || 0,
        thumbnail: videoInfo.thumbnail || '',
        uploader: videoInfo.uploader || 'Unknown',
        platforms: detectPlatform(url),
        formats: extractFormats(videoInfo.formats || []),
        available: true
      };

      res.json(info);
    } catch (error) {
      console.error('yt-dlp error:', error.message);
      
      // More detailed error messages
      let errorMsg = 'Could not retrieve video info';
      
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMsg = 'Video is private or restricted. Try making it public.';
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMsg = 'Video not found. Check the URL and try again.';
      } else if (error.message.includes('Sign in')) {
        errorMsg = 'Video requires sign in. Try a public video.';
      } else if (error.message.includes('Unsupported')) {
        errorMsg = 'This platform is not supported. Try YouTube, TikTok, or Instagram.';
      }
      
      res.status(400).json({ 
        error: errorMsg,
        details: process.env.NODE_ENV === 'development' ? error.message : null
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
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) return 'Facebook';
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
          filesize: format.filesize || 0
        };
      }
    }
  });

  return Object.values(qualityMap)
    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
    .slice(0, 6); // Return top 6 qualities
}

module.exports = router;
