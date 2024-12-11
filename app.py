
from flask import Flask, render_template, jsonify, request
from utils.youtube import get_video_id, get_transcript

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/transcript", methods=['POST'])
def fetch_transcript():
    try:
        url = request.json.get('url')
        video_id = get_video_id(url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL'}), 400
            
        transcript = get_transcript(video_id)
        return jsonify({'transcript': transcript})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
