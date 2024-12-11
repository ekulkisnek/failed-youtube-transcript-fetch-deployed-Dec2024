
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transcriptForm');
    const urlInput = document.getElementById('youtubeUrl');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const transcriptContainer = document.getElementById('transcriptContainer');
    const transcriptText = document.getElementById('transcriptText');
    const copyButton = document.getElementById('copyButton');

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

    async function getTranscript(videoId) {
        const response = await fetch(`https://youtube.com/watch?v=${videoId}`);
        const html = await response.text();
        
        // Extract captions data from the page
        const captionsMatch = html.match(/"captions":\s*({[^}]+})/);
        if (!captionsMatch) {
            throw new Error('No captions found for this video');
        }

        const captionsData = JSON.parse(captionsMatch[1]);
        const transcriptUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
        
        const transcriptResponse = await fetch(transcriptUrl);
        const transcriptXml = await transcriptResponse.text();
        
        // Parse XML and extract text
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(transcriptXml, "text/xml");
        const textElements = xmlDoc.getElementsByTagName('text');
        
        return Array.from(textElements).map(element => ({
            text: element.textContent,
            start: parseFloat(element.getAttribute('start')),
            duration: parseFloat(element.getAttribute('dur'))
        }));
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        errorMessage.classList.add('d-none');
        transcriptContainer.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');
        
        const videoId = getVideoId(urlInput.value);
        
        try {
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }
            
            const transcript = await getTranscript(videoId);
            const formattedTranscript = transcript
                .map(entry => entry.text)
                .join('\n');
            
            transcriptText.textContent = formattedTranscript;
            transcriptContainer.classList.remove('d-none');
            
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('d-none');
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    });

    // Initialize clipboard.js
    new ClipboardJS('#copyButton', {
        text: function() {
            return transcriptText.textContent;
        }
    }).on('success', function(e) {
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check me-1"></i> Copied!';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    });
});
