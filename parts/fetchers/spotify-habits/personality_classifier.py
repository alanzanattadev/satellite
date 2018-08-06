#!/usr/bin/env python3
import satellipy.utils.cli as CliUtils
import satellipy.configuration.mongo as MongoConf
import satellipy.ai.model as Model
import satellipy.ai.predict as Predictor



if __name__ == "__main__":
    username = CliUtils.parse_username_from_args()
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    emotions_collection = mongo_client['collections']['emotions']
    audio_features_collection = mongo_client['collections']['audio_features']
    personalities_collection = mongo_client['collections']['personalities']

    model = Model.get_trained_model(emotions_collection, audio_features_collection, personalities_collection)
    Predictor.predict_for_user(username, model, emotions_collection, audio_features_collection)
