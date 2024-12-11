import re
import http.client
import urllib3
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi

# Custom request handler to work in Replit's environment
class ReplitRequestHandler:
    def __init__(self):
        self.pool_manager = urllib3.PoolManager(maxsize=10)
        
    def get(self, url, **kwargs):
        return self.pool_manager.request('GET', url, **kwargs)

def get_video_id(url):
    """Extract video ID from YouTube URL."""
    try:
        # Handle different URL formats
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',  # Standard and shortened
            r'(?:embed\/)([0-9A-Za-z_-]{11})',   # Embed URLs
            r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'  # Shortened URLs
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
                
        # Try parsing the URL for any missed formats
        parsed_url = urlparse(url)
        if parsed_url.netloc in ['www.youtube.com', 'youtube.com', 'youtu.be']:
            if parsed_url.path == '/watch':
                return parse_qs(parsed_url.query)['v'][0]
            elif parsed_url.netloc == 'youtu.be':
                return parsed_url.path[1:]
                
    except Exception:
        return None
    
    return None

def get_transcript(video_id):
    """Fetch transcript for a given video ID."""
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(
            video_id,
            http_client=ReplitRequestHandler()
        )
        
        # Try to get English transcript first
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            # If English not available, get first available transcript
            transcript = transcript_list.find_transcript(['en']).translate('en')
            
        return transcript.fetch()
        
    except Exception as e:
        raise Exception(f"Could not fetch transcript: {str(e)}")
