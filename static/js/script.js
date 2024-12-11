document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transcriptForm');
    const urlInput = document.getElementById('youtubeUrl');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const transcriptContainer = document.getElementById('transcriptContainer');
    const transcriptText = document.getElementById('transcriptText');
    const copyButton = document.getElementById('copyButton');

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

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset UI state
        errorMessage.classList.add('d-none');
        transcriptContainer.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');
        
        try {
            const response = await fetch('/get_transcript', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `url=${encodeURIComponent(urlInput.value)}`
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch transcript');
            }
            
            // Format and display transcript
            const formattedTranscript = data.transcript
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
});
