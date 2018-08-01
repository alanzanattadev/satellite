#!/usr/bin/python

import os
from neo4j.v1 import GraphDatabase


class GraphDB:
    def __init__(self):
        self.uri = os.environ.get("NEO_URI", "bolt://localhost:7687")
        self.user = os.environ.get("NEO_USER", "neo4j")
        self.password = os.environ.get("NEO_PASS", "polo")
        self.driver = GraphDatabase.driver(
            self.uri, auth=(self.user, self.password))

    def createNodeRelation(self):
        with self.driver.session() as session:
            return session.run("CREATE (a:Person {name: $name, interactions: $interactions})", name="Paul", interactions=1)


test = GraphDB()
test.createNodeRelation()
