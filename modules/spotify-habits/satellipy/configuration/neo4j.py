import os

from neo4j.v1 import GraphDatabase

def parse_env():
    # Mongo connection
    neo4j_host = os.environ.get('NEO4J_HOST', "localhost")
    neo4j_port = os.environ.get('NEO4J_PORT', 7687)

    return {
        'host': neo4j_host,
        'port': neo4j_port,
    }


def get_client(configuration):
        neo4j_client = GraphDatabase.driver(
            ("bolt://%s:%s") % (
                configuration['host'],
                configuration['port']
            ),
            auth=("neo4j", "test"))
        return {
            'client': neo4j_client,
        }
