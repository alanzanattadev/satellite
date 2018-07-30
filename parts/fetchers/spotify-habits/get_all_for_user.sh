#!/usr/bin/env bash

./get_habits.py $1 &&
./get_lyrics.py $1 &&
./get_emotions.py $1 &&
./get_audio_features.py $1 &&
./get_emotion_profile.py $1 &&
./personality_classifier $1
