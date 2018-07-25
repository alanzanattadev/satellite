from satellipy.analysis import audio as Audio
from satellipy.analysis import emotions as Emotions


def analyse_and_get_personality_features(
        username,
        emotions_collection,
        audio_features_collection):

    audio_analysis = Audio.analyse_audio_for_user(
        username, audio_features_collection
    )
    emotions_analysis = Emotions.analyse_emotions_of_user(
        username, emotions_collection
    )
    return {
        'audio': audio_analysis,
        'emotions': emotions_analysis,
    }
