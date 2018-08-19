import numpy as np
import satellipy.analysis as Analysis
import satellipy.personalities

def predict_for_user(username, model, emotions_collection, audio_features_collection):
    target_accounts = np.array([
        Analysis.get_features_for_user(
            username, emotions_collection, audio_features_collection
        )
    ])
    predictions = model.predict(target_accounts)
    results = [{'probability': p, 'type': satellipy.personalities.personalities[i]} for i,p in enumerate(predictions[0])]
    results.sort(key=lambda x: x['probability'], reverse=True)
    print("-------- Results --------")
    print("Personality: %s" % (satellipy.personalities.personalities[np.argmax(predictions[0])]))
    print("----------")
    for result in results:
        print("%s: %f" % (result['type'], result['probability']))
    print("-------------------------")
    return results
