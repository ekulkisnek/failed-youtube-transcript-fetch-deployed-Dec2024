import logging
from flask import Flask, render_template, request, jsonify
from utils.youtube import get_video_id, get_transcript

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_transcript", methods=["POST"])
def fetch_transcript():
    try:
        url = request.form.get("url")
        if not url:
            return jsonify({"error": "No URL provided"}), 400

        video_id = get_video_id(url)
        if not video_id:
            return jsonify({"error": "Invalid YouTube URL"}), 400

        transcript = get_transcript(video_id)
        return jsonify({"transcript": transcript})

    except Exception as e:
        logger.error(f"Error fetching transcript: {str(e)}")
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)