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
      // Build command with universal browser headers
      let headers = '--add-header "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"';
      headers += ' --add-header "Accept-Language:en-US,en;q=0.9"';
      headers += ' --add-header "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"';
      
      // Platform-specific headers
      if (url.includes('facebook.com') || url.includes('fb.watch')) {
        headers += ' --add-header "Referer:https://www.facebook.com/"';
        headers += ' --add-header "Cookie:datr=test"';
      } else if (url.includes('instagram.com')) {
        headers += ' --add-header "Referer:https://www.instagram.com/"';
      } else if (url.includes('tiktok.com')) {
        headers += ' --add-header "Referer:https://www.tiktok.com/"';
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        headers += ' --add-header "Referer:https://twitter.com/"';
      } else if (url.includes('vimeo.com')) {
        headers += ' --add-header "Referer:https://www.vimeo.com/"';
      } else if (url.includes('twitch.tv')) {
        headers += ' --add-header "Referer:https://www.twitch.tv/"';
      } else if (url.includes('reddit.com')) {
        headers += ' --add-header "Referer:https://www.reddit.com/"';
      }
      
      const command = `yt-dlp -j ${headers} --no-warnings "${url}"`;
      
      console.log(`[INFO] Processing URL: ${url.substring(0, 60)}...`);
      console.log(`[INFO] Using headers for platform detection`);
      
      const output = execSync(command, { 
        encoding: 'utf-8', 
        maxBuffer: 50 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000
      });
      
      const videoInfo = JSON.parse(output);

      // Extract relevant information
      const info = {
        title: videoInfo.title || 'Unknown',
        duration: videoInfo.duration || 0,
        thumbnail: videoInfo.thumbnail || '',
        uploader: videoInfo.uploader || videoInfo.channel || 'Unknown',
        platforms: detectPlatform(url),
        formats: extractFormats(videoInfo.formats || []),
        available: true
      };

      console.log(`[SUCCESS] Retrieved info for: ${info.title}`);
      res.json(info);
    } catch (error) {
      console.error('[ERROR] yt-dlp failed:', error.message);
      
      // More detailed error messages
      let errorMsg = 'Could not retrieve video info';
      let statusCode = 400;
      
      const errorStr = error.message.toLowerCase();
      
      if (errorStr.includes('403') || errorStr.includes('forbidden')) {
        errorMsg = '🔒 Video is private or restricted. Make sure it\'s public.';
      } else if (errorStr.includes('404') || errorStr.includes('not found')) {
        errorMsg = '❌ Video not found. Check the URL.';
      } else if (errorStr.includes('sign in') || errorStr.includes('authentication')) {
        errorMsg = '🔐 Video requires sign-in. Try a public video.';
      } else if (errorStr.includes('unsupported') || errorStr.includes('extractor')) {
        errorMsg = '⚠️ Platform not supported or video unavailable.';
      } else if (errorStr.includes('timeout')) {
        errorMsg = '⏱️ Request timeout. Server may be slow. Try again.';
      } else if (errorStr.includes('no such file')) {
        errorMsg = '⚙️ yt-dlp not installed on server. Contact admin.';
      } else if (errorStr.includes('georestricted')) {
        errorMsg = '🌍 Video is geo-restricted to your region.';
      }
      
      res.status(statusCode).json({ 
        error: errorMsg,
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  } catch (error) {
    console.error('[ERROR] Info endpoint error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
  if (!formats || formats.length === 0) {
    return [];
  }
  
  const qualityMap = {};

  formats.forEach(format => {
    try {
      if (format.height && format.height > 0) {
        const quality = `${format.height}p`;
        if (!qualityMap[quality]) {
          qualityMap[quality] = {
            quality,
            format_id: format.format_id,
            ext: format.ext || 'mp4',
            filesize: format.filesize || format.filesize_approx || 0
          };
        }
      }
    } catch (e) {
      // Skip malformed format entries
    }
  });

  const result = Object.values(qualityMap)
    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
    .slice(0, 10); // Return top 10 qualities
  
  console.log(`[INFO] Available formats: ${result.map(f => f.quality).join(', ')}`);
  return result;
}

module.exports = router;
