import tensorflow as tf
from tensorflow import keras
import numpy as np
import satellipy.utils.cli as CliUtils
import satellipy.analysis as Analysis
import satellipy.configuration.mongo as MongoConf
import satellipy.personalities

def get_model():
    model = keras.Sequential([
        keras.layers.Dense(128, activation=tf.nn.relu),
        keras.layers.Dense(16, activation=tf.nn.softmax)
    ])

    model.compile(
        optimizer=tf.train.AdamOptimizer(),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

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


def get_trained_model(emotions_collection, audio_features_collection, personalities_collection):
    model = get_model()
    train_accounts, train_labels = get_training_set(
        emotions_collection,
        audio_features_collection,
        personalities_collection
    )
    model.fit(train_accounts, train_labels, epochs=5000)

    test_accounts, test_labels = (train_accounts, train_labels)
    test_loss, test_acc = model.evaluate(test_accounts, test_labels)
    print('Test accuracy:', test_acc)

    return model
