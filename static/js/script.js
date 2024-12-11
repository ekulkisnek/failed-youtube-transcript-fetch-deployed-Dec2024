
async function getTranscript(videoId) {
    try {
        // Fetch the video page
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch video page');
        
        const html = await response.text();
        const captionsMatch = html.match(/"captionTracks":\[(.*?)\]/);
        
        if (!captionsMatch) {
            throw new Error('No captions available for this video');
        }
        
        const captions = JSON.parse(`[${captionsMatch[1]}]`);
        const englishCaptions = captions.find(c => c.languageCode === 'en');
        
        if (!englishCaptions) {
            throw new Error('No English captions available');
        }
        
        const transcriptResponse = await fetch(englishCaptions.baseUrl);
        if (!transcriptResponse.ok) throw new Error('Failed to fetch transcript');
        
        const transcriptText = await transcriptResponse.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(transcriptText, 'text/xml');
        
        return Array.from(xmlDoc.getElementsByTagName('text'))
            .map(text => text.textContent.trim())
            .join('\n');
            
    } catch (error) {
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transcriptForm');
    const urlInput = document.getElementById('youtubeUrl');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const transcriptContainer = document.getElementById('transcriptContainer');
    const transcriptText = document.getElementById('transcriptText');
    const copyButton = document.getElementById('copyButton');

    copyButton.addEventListener('click', function() {
        navigator.clipboard.writeText(transcriptText.textContent).then(() => {
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '<i class="fas fa-check me-1"></i> Copied!';
            setTimeout(() => {
                copyButton.innerHTML = originalText;
            }, 2000);
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        errorMessage.classList.add('d-none');
        transcriptContainer.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');
        
        const videoId = getVideoId(urlInput.value);
        if (!videoId) {
            errorMessage.textContent = 'Invalid YouTube URL';
            errorMessage.classList.remove('d-none');
            loadingSpinner.classList.add('d-none');
            return;
        }

        try {
            const transcript = await getTranscript(videoId);
            transcriptText.textContent = transcript;
            transcriptContainer.classList.remove('d-none');
        } catch (error) {
            errorMessage.textContent = error.message || 'Failed to fetch transcript';
            errorMessage.classList.remove('d-none');
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    });
});

function getVideoId(url) {
    const patterns = [
        /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
        /(?:embed\/)([0-9A-Za-z_-]{11})/,
        /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}
