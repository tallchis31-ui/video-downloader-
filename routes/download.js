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

    // Get platform-specific headers
    const headers = getPlatformHeaders(url);
    
    // Build yt-dlp command with platform-specific options
    let command = `yt-dlp ${headers} --no-warnings -o "${tempDir}/%(title)s.%(ext)s"`;

    if (format === 'mp3') {
      // Audio only
      command = `yt-dlp ${headers} -x --audio-format mp3 --audio-quality 192K --no-warnings -o "${tempDir}/%(title)s.%(ext)s" "${url}"`;
    } else if (format === 'mp4' && quality) {
      // Video with specific quality
      command = `yt-dlp ${headers} -f "best[height<=${quality}]/best" --merge-output-format mp4 --no-warnings -o "${tempDir}/%(title)s.%(ext)s" "${url}"`;
    } else {
      // Default best quality
      command = `yt-dlp ${headers} -f "best" --merge-output-format mp4 --no-warnings -o "${tempDir}/%(title)s.%(ext)s" "${url}"`;
    }

    // Execute download
    try {
      const output = execSync(command, { 
        encoding: 'utf-8', 
        maxBuffer: 10 * 1024 * 1024,
        timeout: 300000, // 5 minute timeout
        stdio: ['pipe', 'pipe', 'pipe']
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
      
      let errorMsg = 'Download failed';
      if (error.message.includes('Video unavailable')) {
        errorMsg = 'Video is unavailable or restricted';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMsg = 'Access denied. Video may be private.';
      } else if (error.message.includes('404')) {
        errorMsg = 'Video not found';
      } else if (error.message.includes('Sign in')) {
        errorMsg = 'Video requires authentication';
      }
      
      res.status(400).json({ 
        error: errorMsg,
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }

  } catch (error) {
    console.error('Download route error:', error);
    res.status(500).json({ error: 'Server error during download' });
  }
});

// Helper: Get platform-specific headers and options
function getPlatformHeaders(url) {
  const urlLower = url.toLowerCase();
  
  // User-Agent header for all requests
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const baseHeaders = `--add-header "User-Agent:${userAgent}"`;
  
  // Platform-specific options
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) {
    // Facebook needs extra headers
    return `${baseHeaders} --add-header "Referer:https://www.facebook.com/" --add-header "Cookie:datr=test" --add-header "Accept-Language:en-US,en;q=0.9"`;
  } else if (urlLower.includes('instagram.com')) {
    // Instagram
    return `${baseHeaders} --add-header "Referer:https://www.instagram.com/"`;
  } else if (urlLower.includes('tiktok.com')) {
    // TikTok
    return `${baseHeaders} --add-header "Referer:https://www.tiktok.com/" --add-header "Accept-Language:en-US,en;q=0.9"`;
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    // Twitter/X
    return `${baseHeaders} --add-header "Referer:https://twitter.com/"`;
  } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    // YouTube
    return `${baseHeaders}`;
  } else if (urlLower.includes('vimeo.com')) {
    // Vimeo
    return `${baseHeaders} --add-header "Referer:https://www.vimeo.com/"`;
  } else if (urlLower.includes('twitch.tv')) {
    // Twitch
    return `${baseHeaders} --add-header "Referer:https://www.twitch.tv/"`;
  } else if (urlLower.includes('reddit.com')) {
    // Reddit
    return `${baseHeaders} --add-header "Referer:https://www.reddit.com/"`;
  }
  
  // Default headers for unknown platforms
  return baseHeaders;
}

module.exports = router;
