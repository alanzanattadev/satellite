#!/usr/bin/env python3
import tensorflow as tf
from tensorflow import keras
import numpy as np
import satellipy.utils.cli as CliUtils
import satellipy.analysis as Analysis
import satellipy.configuration.mongo as MongoConf
import satellipy.personalities


def get_training_set(
    emotions_collection, audio_features_collection, personalities_collection
):
    train_accounts = []
    train_labels = []
    cursor = personalities_collection.find({'processed': True, 'predicted': False})
    for doc in cursor:
        train_accounts.append(
            Analysis.get_features_for_user(
                doc['user_id'],
                emotions_collection,
                audio_features_collection
            )
        )
        train_labels.append(
            satellipy.personalities.personalities.index(
                doc['personality_label']
            )
        )
    return (np.array(train_accounts), np.array(train_labels))


if __name__ == "__main__":
    username = CliUtils.parse_username_from_args()
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    emotions_collection = mongo_client['collections']['emotions']
    audio_features_collection = mongo_client['collections']['audio_features']
    personalities_collection = mongo_client['collections']['personalities']

    model = keras.Sequential([
        keras.layers.Dense(128, activation=tf.nn.relu),
        keras.layers.Dense(16, activation=tf.nn.softmax)
    ])

    model.compile(
        optimizer=tf.train.AdamOptimizer(),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    train_accounts, train_labels = get_training_set(
        emotions_collection,
        audio_features_collection,
        personalities_collection
    )
    model.fit(train_accounts, train_labels, epochs=10000)

    test_accounts, test_labels = (train_accounts, train_labels)
    test_loss, test_acc = model.evaluate(test_accounts, test_labels)
    print('Test accuracy:', test_acc)

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
