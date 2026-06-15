// API Base URL
const API_BASE = window.location.origin;

// Hide/Show elements
function hideElement(id) {
  document.getElementById(id).classList.add('hidden');
}

function showElement(id) {
  document.getElementById(id).classList.remove('hidden');
}

// Format duration to MM:SS
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Show message
function showMessage(type, message) {
  const messageId = type === 'error' ? 'errorMessage' : 'successMessage';
  const element = document.getElementById(messageId);
  element.textContent = message;
  showElement(messageId);
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => hideElement(messageId), 5000);
  }
}

// Fetch video info
async function fetchVideoInfo() {
  const url = document.getElementById('videoUrl').value.trim();

  if (!url) {
    showMessage('error', '❌ Please paste a video URL');
    return;
  }

  // Show loading state
  document.getElementById('fetchBtn').classList.add('hidden');
  showElement('fetchLoader');
  hideElement('errorMessage');

  try {
    const response = await fetch(`${API_BASE}/api/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch video info');
    }

    // Display video info
    displayVideoInfo(data);
    showElement('videoInfo');
    hideElement('errorMessage');

  } catch (error) {
    console.error('Error:', error);
    showMessage('error', `❌ ${error.message}`);
    hideElement('videoInfo');
  } finally {
    hideElement('fetchLoader');
    showElement('fetchBtn');
  }
}

// Display video information
function displayVideoInfo(data) {
  // Thumbnail
  if (data.thumbnail) {
    document.getElementById('videoThumbnail').src = data.thumbnail;
  }

  // Title
  document.getElementById('videoTitle').textContent = data.title || 'Unknown Title';

  // Platform
  const platformBadge = document.getElementById('videoPlatform');
  platformBadge.textContent = data.platforms || 'Unknown Platform';
  platformBadge.style.backgroundColor = getPlatformColor(data.platforms);

  // Uploader
  document.getElementById('videoUploader').textContent = `By: ${data.uploader}`;

  // Duration
  document.getElementById('videoDuration').textContent = `Duration: ${formatDuration(data.duration)}`;

  // Populate quality dropdown
  const qualitySelect = document.getElementById('qualitySelect');
  qualitySelect.innerHTML = '<option value="">Select Quality</option>';

  if (data.formats && data.formats.length > 0) {
    data.formats.forEach(format => {
      const option = document.createElement('option');
      option.value = format.quality.replace('p', '');
      option.textContent = `${format.quality} (${(format.filesize / 1024 / 1024).toFixed(1)} MB)`;
      qualitySelect.appendChild(option);
    });
    showElement('qualityGroup');
  } else {
    hideElement('qualityGroup');
  }
}

// Get platform color
function getPlatformColor(platform) {
  const colors = {
    'YouTube': '#ff0000',
    'TikTok': '#000000',
    'Instagram': '#E4405F',
    'Twitter/X': '#1DA1F2',
    'Vimeo': '#1ab7ea',
    'Facebook': '#4267B2',
    'Twitch': '#9146FF',
    'Reddit': '#FF4500'
  };
  return colors[platform] || '#4ecdc4';
}

// Download video
async function downloadVideo() {
  const url = document.getElementById('videoUrl').value.trim();
  const format = document.querySelector('input[name="format"]:checked').value;
  const quality = format === 'mp4' ? document.getElementById('qualitySelect').value : null;

  if (!url) {
    showMessage('error', '❌ Please paste a video URL');
    return;
  }

  if (format === 'mp4' && !quality) {
    showMessage('error', '❌ Please select a quality');
    return;
  }

  // Show loading state
  document.getElementById('downloadBtn').classList.add('hidden');
  showElement('downloadLoader');

  try {
    const response = await fetch(`${API_BASE}/api/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        quality,
        format
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `video.${format}`;
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches) {
        filename = matches[1];
      }
    }

    // Download file
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    showMessage('success', `✅ Download started! File: ${filename}`);

  } catch (error) {
    console.error('Download error:', error);
    showMessage('error', `❌ ${error.message}`);
  } finally {
    showElement('downloadBtn');
    document.getElementById('downloadLoader').classList.add('hidden');
  }
}

// Handle format change
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[name="format"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'mp3') {
        hideElement('qualityGroup');
      } else {
        showElement('qualityGroup');
      }
    });
  });

  // Enter key to fetch info
  document.getElementById('videoUrl').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      fetchVideoInfo();
    }
  });
});
