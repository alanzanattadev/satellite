
def analyse_emotions_of_user(username, emotions_collection):
    # Compute profile
    anger = {'type': 'anger', 'count': emotions_collection.find(
        {'user_id': username, 'emotions.type': "anger"}).count()}
    surprise = {'type': 'surprise', 'count': emotions_collection.find(
        {'user_id': username, 'emotions.type': "surprise"}).count()}
    fear = {'type': 'fear', 'count': emotions_collection.find(
        {'user_id': username, 'emotions.type': "fear"}).count()}
    disgust = {'type': 'disgust', 'count': emotions_collection.find(
        {'user_id': username, 'emotions.type': "disgust"}).count()}
    joy = {'type': 'joy', 'count': emotions_collection.find(
        {'user_id': username, 'emotions.type': "joy"}).count()}
    sadness = {'type': 'sadness', 'count': emotions_collection.find(
        {'user_id': username, 'emotions.type': "sadness"}).count()}

    emotions = [anger, surprise, fear, disgust, joy, sadness]
    emotions.sort(key=lambda a: a['count'], reverse=True)
    return emotions
