#!/usr/bin/env python3
import satellipy.utils.cli as CliUtils
import satellipy.configuration.mongo as MongoConf
import satellipy.ai.model as Model
import satellipy.ai.predict as Predictor
import satellipy.configuration.neo4j as Neo4JConf
import satellipy.analysis.personalities as Personalities
import sklearn.model_selection

if __name__ == "__main__":
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    emotions_collection = mongo_client['collections']['emotions']
    audio_features_collection = mongo_client['collections']['audio_features']
    personalities_collection = mongo_client['collections']['personalities']

    neo4J_client = Neo4JConf.get_client(Neo4JConf.parse_env())
    cl = neo4J_client['client']


    precisions = []
    for i in range(1, 7):
        model = Model.get_model()
        accounts, labels = Model.get_training_set(
            emotions_collection,
            audio_features_collection,
            personalities_collection
        )
        train_accounts, test_accounts, train_labels, test_labels = sklearn.model_selection.train_test_split(accounts, labels, test_size=0.95, random_state=i*i)
        model.fit(train_accounts, train_labels, epochs=5000, verbose=0)
        test_loss, test_acc = model.evaluate(test_accounts, test_labels)
        print('Test accuracy:', test_acc)
        precisions.append(test_acc)
    print('Average accuracy:', sum(precisions) / len(precisions))