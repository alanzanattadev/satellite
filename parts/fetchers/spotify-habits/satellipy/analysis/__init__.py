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
    _, emotions_analysis, emotions_stats = Emotions.analyse_emotions_of_user(
        username, emotions_collection
    )
    return {
        'audio': audio_analysis,
        'emotions': emotions_analysis,
        'emotions_stats': emotions_stats,
    }


def flatten_features(features):
    emotions_stats_count = features['emotions_stats']['count'];
    emotions_count = 1 if emotions_stats_count == 0 else emotions_stats_count
    f = [
        features['audio']['averages']['valence'],
        features['audio']['averages']['danceability'],
        features['audio']['averages']['energy'],
        features['emotions']['joy']['count'] / emotions_count,
        features['emotions']['sadness']['count'] / emotions_count,
        features['emotions']['anger']['count'] / emotions_count,
        features['emotions']['disgust']['count'] / emotions_count,
        features['emotions']['fear']['count'] / emotions_count,
        features['emotions']['surprise']['count'] / emotions_count,
    ]
    return f


def get_features_for_user(
        username, emotions_collection, audio_features_collection):
    return flatten_features(analyse_and_get_personality_features(
        username, emotions_collection, audio_features_collection
    ))
