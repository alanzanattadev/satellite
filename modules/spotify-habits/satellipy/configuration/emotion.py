import os


def parse_env():
    # Emotion API Connection
    emotion_host = os.environ.get('EMOTION_HOST', 'localhost')
    emotion_port = os.environ.get('EMOTION_PORT', 5000)
    return {
        'host': emotion_host,
        'port': emotion_port
    }
