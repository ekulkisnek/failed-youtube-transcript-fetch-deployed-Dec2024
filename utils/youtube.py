import re
import logging
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, VideoUnavailable

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
        logger.debug(f"Attempting to fetch transcript for video ID: {video_id}")
        
        proxies = {
            'http': None,
            'https': None
        }
        
        # Try direct fetch first with proxy settings
        try:
            return YouTubeTranscriptApi.get_transcript(video_id, languages=['en'], proxies=proxies)
        except Exception as e:
            logger.debug(f"Direct fetch failed: {str(e)}")
            
            # Fall back to list_transcripts approach
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id, proxies=proxies)
            try:
                transcript = transcript_list.find_generated_transcript(['en'])
                return transcript.fetch()
            except NoTranscriptFound:
                transcript = transcript_list.find_transcript(['en'])
                return transcript.fetch()
        except NoTranscriptFound:
            logger.debug("No English transcript found, attempting translation")
            # Get first available transcript and translate to English
            available_transcripts = transcript_list.manual_generated_transcripts
            if not available_transcripts:
                raise Exception("No transcripts available for this video")
            
            first_lang = list(available_transcripts.keys())[0]
            logger.debug(f"Translating transcript from {first_lang} to English")
            transcript = transcript_list.find_transcript([first_lang]).translate('en')
            
        return transcript.fetch()
        
    except VideoUnavailable:
        logger.error(f"Video {video_id} is unavailable")
        raise Exception("The video is unavailable or private")
    except TranscriptsDisabled:
        logger.error(f"Transcripts are disabled for video {video_id}")
        raise Exception("Transcripts are disabled for this video")
    except NoTranscriptFound:
        logger.error(f"No transcript found for video {video_id}")
        raise Exception("No transcript available for this video")
    except Exception as e:
        logger.error(f"Unexpected error fetching transcript: {str(e)}", exc_info=True)
        raise Exception(f"Could not fetch transcript: {str(e)}")