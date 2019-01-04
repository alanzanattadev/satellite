import os

from neo4j.v1 import GraphDatabase

def parse_env():
    # Mongo connection
    neo4j_host = os.environ.get('NEO4J_HOST', "localhost")
    neo4j_port = os.environ.get('NEO4J_PORT', 7687)
    neo4j_auth_user = os.environ.get('NEO4J_AUTH_USER', 'neo4j')
    neo4j_auth_pass = os.environ.get('NEO4J_AUTH_PASS', 'test')

    return {
        'host': neo4j_host,
        'port': neo4j_port,
        'user': neo4j_auth_user,
        'pass': neo4j_auth_pass,
    }


def get_client(configuration):
        neo4j_client = GraphDatabase.driver(
            ("bolt://%s:%s") % (
                configuration['host'],
                configuration['port']
            ),
            auth=(configuration['user'], configuration['pass']))
        return {
            'client': neo4j_client,
        }
