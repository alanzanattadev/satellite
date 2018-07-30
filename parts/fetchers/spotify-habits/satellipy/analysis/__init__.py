import numpy as np
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


def flatten_features(features):
    f = [
        features['audio']['averages']['valence'],
        features['audio']['averages']['danceability'],
        features['audio']['averages']['energy'],
    ]
    return f


def get_features_for_user(
        username, emotions_collection, audio_features_collection):
    return flatten_features(analyse_and_get_personality_features(
        username, emotions_collection, audio_features_collection
    ))
