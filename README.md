# 🎬 Video Downloader

A professional web application to download videos from YouTube, TikTok, Instagram, Twitter/X, Vimeo, Facebook, Twitch, Reddit, and more. Download in MP4 (video) or MP3 (audio) format.

## Features

✨ **Multi-Platform Support**
- YouTube
- TikTok
- Instagram
- Twitter/X
- Vimeo
- Facebook
- Twitch
- Reddit
- And more!

📥 **Download Formats**
- MP4 (video) - Choose quality from 1080p down to 360p
- MP3 (audio) - 192kbps quality

💰 **Monetization**
- Google AdSense integration
- Multiple ad placements (top, sidebar, footer)

🚀 **Performance**
- Rate limiting to prevent abuse
- Temporary file cleanup
- Async downloads
- Error handling

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Video Processing**: yt-dlp
- **Audio Processing**: FFmpeg

## Installation

### Requirements
- Node.js (v14+)
- yt-dlp (for video downloading)
- FFmpeg (for audio conversion)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/tallchis31-ui/video-downloader-.git
cd video-downloader-
```

2. **Install yt-dlp** (if not already installed)
```bash
# macOS
brew install yt-dlp

# Ubuntu/Debian
sudo apt-get install yt-dlp

# Windows (using pip)
pip install yt-dlp
```

3. **Install FFmpeg** (required for audio conversion)
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

4. **Install Node dependencies**
```bash
npm install
```

5. **Create .env file**
```bash
cp .env.example .env
```

6. **Add your Google AdSense credentials to .env**
```
GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxxxxxxxx
GOOGLE_ADSENSE_SLOT=xxxxxxxx
```

7. **Start the server**
```bash
npm start
```

The site will be available at `http://localhost:3000`

## Environment Variables

```
PORT=3000
NODE_ENV=development
GOOGLE_ADSENSE_ID=your_adsense_id
GOOGLE_ADSENSE_SLOT=your_adsense_slot
RATE_LIMIT_WINDOW=15        # Minutes
RATE_LIMIT_MAX_REQUESTS=10  # Per window
```

## API Endpoints

### Get Video Information
```
POST /api/info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=..."
}

Response:
{
  "title": "Video Title",
  "duration": 300,
  "thumbnail": "https://...",
  "uploader": "Channel Name",
  "platforms": "YouTube",
  "formats": [
    {
      "quality": "1080p",
      "format_id": "18",
      "ext": "mp4",
      "filesize": 1024000
    }
  ]
}
```

### Download Video
```
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "format": "mp4",
  "quality": "720"
}

Response: Binary file stream (video/mp4 or audio/mp3)
```

## Deployment

### Deploy to Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Deploy to Railway
```bash
railway up
```

### Deploy to Render
```bash
# Connect your GitHub repo and deploy through their dashboard
```

## Important Legal Notice

**⚠️ Disclaimer**: This tool is for downloading videos that you have the right to download. Users are responsible for:
- Respecting copyright laws in their jurisdiction
- Not downloading copyrighted content without permission
- Following the terms of service of video platforms
- Using downloaded content only for personal use

The creator assumes no responsibility for misuse of this tool.

## Revenue Model

1. **Google AdSense** - Primary revenue source
   - Top banner ad
   - Sidebar ads
   - Footer ad

2. **Potential Future Revenue**
   - Premium features (batch downloads, HD+)
   - Affiliate links
   - Sponsorships

## Security

- Rate limiting on download endpoint
- Input validation on URLs
- Temporary file cleanup after download
- Error messages don't expose system details in production

## Troubleshooting

### "yt-dlp not found"
```bash
# Make sure yt-dlp is installed and in PATH
which yt-dlp
pip install --upgrade yt-dlp
```

### "Could not retrieve video info"
- The video might be private or geoblocked
- Try a different video URL
- Ensure you have internet connection

### "Download failed"
- Video might be unavailable
- Check rate limiting (max 10 downloads per 15 minutes)
- Try again in a few moments

## Future Enhancements

- [ ] Video quality preview
- [ ] Batch downloads
- [ ] Download history
- [ ] Custom file naming
- [ ] Direct cloud storage integration (Google Drive, Dropbox)
- [ ] Mobile app
- [ ] API for third-party integration

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [Report a bug](https://github.com/tallchis31-ui/video-downloader-/issues)
- Email: support@example.com

---

**Made with ❤️ by tallchis31-ui**

*Disclaimer: This is a learning/development project. Users are responsible for complying with local laws and platform terms of service.*
