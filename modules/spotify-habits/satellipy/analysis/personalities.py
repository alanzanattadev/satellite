
def store_personalities(driver, username, results):
    with driver.session() as session:
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
