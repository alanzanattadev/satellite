from functools import reduce

def analyse_emotions_of_user(username, emotions_collection):
    # Compute profile
    anger = {'type': 'anger', 'count': emotions_collection.find(
        {'users': {'$in': [username]}, 'emotions.type': "anger"}).count()}
    surprise = {'type': 'surprise', 'count': emotions_collection.find(
        {'users': {'$in': [username]}, 'emotions.type': "surprise"}).count()}
    fear = {'type': 'fear', 'count': emotions_collection.find(
        {'users': {'$in': [username]}, 'emotions.type': "fear"}).count()}
    disgust = {'type': 'disgust', 'count': emotions_collection.find(
        {'users': {'$in': [username]}, 'emotions.type': "disgust"}).count()}
    joy = {'type': 'joy', 'count': emotions_collection.find(
        {'users': {'$in': [username]}, 'emotions.type': "joy"}).count()}
    sadness = {'type': 'sadness', 'count': emotions_collection.find(
        {'users': {'$in': [username]}, 'emotions.type': "sadness"}).count()}

    emotionsAsList = [anger, surprise, fear, disgust, joy, sadness]
    emotionsAsList.sort(key=lambda a: a['count'], reverse=True)
    emotionsAsDict = {
        'anger': anger,
        'surprise': surprise,
        'fear': fear,
        'disgust': disgust,
        'joy': joy,
        'sadness': sadness
    }
    stats = {
        'count': reduce(lambda red, e: e['count'] + red, emotionsAsList, 0)
    }
    return (emotionsAsList, emotionsAsDict, stats)
