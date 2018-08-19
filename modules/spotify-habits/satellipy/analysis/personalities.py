
def store_personalities(driver, username, results):
    with driver.session() as session:
        output = session.write_transaction(lambda tx: tx.run(
            "MERGE (sa:SpotifyAccount { spotify_id: $spotifyID }) "
            "ON CREATE SET sa.spotify_id = $spotifyID "
            + " ".join(
                (("MERGE (%(type)s:Personality { personality: '%(type)s' }) "
                    "ON CREATE SET %(type)s.personality = '%(type)s' "
                    "MERGE (sa)-[r%(type)s:HAS_PERSONALITY]->(%(type)s) SET r%(type)s.probability = %(probability)s")
                    % result
                if result['probability'] > 0.3 else "" for result in results)
            )
            + "RETURN sa",
            spotifyID=username
        ))
