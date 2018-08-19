#!/usr/bin/env python3
import satellipy.utils.cli as CliUtils
import satellipy.configuration.mongo as MongoConf
import satellipy.ai.model as Model
import satellipy.ai.predict as Predictor
import satellipy.configuration.neo4j as Neo4JConf


if __name__ == "__main__":
    username = CliUtils.parse_username_from_args()
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    emotions_collection = mongo_client['collections']['emotions']
    audio_features_collection = mongo_client['collections']['audio_features']
    personalities_collection = mongo_client['collections']['personalities']

    neo4J_client = Neo4JConf.get_client(Neo4JConf.parse_env())
    cl = neo4J_client['client']

    model = Model.get_trained_model(
        emotions_collection,
        audio_features_collection, personalities_collection)
    results = Predictor.predict_for_user(
        username, model,
        emotions_collection, audio_features_collection)
    with cl.session() as session:
        output = session.write_transaction(lambda tx: tx.run(
            "MERGE (sa:SpotifyAccount { spotify_id: $spotifyID }) "
            "ON CREATE SET sa.spotify_id = $spotifyID "
            + " ".join(
                (("MERGE (%(type)s:Personality { personality: '%(type)s' }) "
                    "ON CREATE SET %(type)s.personality = '%(type)s' "
                    "CREATE (sa)-[r%(type)s:HAS_PERSONALITY { probability: %(probability)s }]->(%(type)s)")
                    % result
                if result['probability'] > 0.3 else "" for result in results)
            )
            + "RETURN sa",
            spotifyID=username
        ))
