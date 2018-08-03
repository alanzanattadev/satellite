#!/usr/bin/python

import os
from neo4j.v1 import GraphDatabase
import datetime


class GraphDB:
    def __init__(self, profileAfterProcess):
        self.uri = os.environ.get("NEO_URI", "bolt://localhost:7687")
        self.user = os.environ.get("NEO_USER", "neo4j")
        self.password = os.environ.get("NEO_PASS", "polo")
        self.driver = GraphDatabase.driver(
            self.uri, auth=(self.user, self.password))
        self.profile = profileAfterProcess
        self.owner = profileAfterProcess["profileUser"]
        self.createOneNodeRelation(
            self.owner, "Log: Creation of mother User...")
        self.fetchNodesLanguage()

    def createOneNodeRelation(self, name, msglog):
        with self.driver.session() as session:
            print(msglog)
            return session.run("CREATE (a:Person {name: $name})", name=name)

    def createRelationUser(self, user, data):
        with self.driver.session() as session:
            print("Log: Creation of User relation " + user)
            return session.run("MATCH (a:Person) WHERE a.name = $nameA CREATE (b:Person {name: $nameB})-[r:RELATION {interactions: $interac, first_interaction: $firstI}]->(a)", nameA=self.owner, nameB=user, interac=data["count"], firstI=data["first_interac"].strftime("%d/%m/%Y"))

    def createNodeLang(self, lang, data):
        with self.driver.session() as session:
            print("Log: Creation of Lang node " + lang)
            return session.run("CREATE (a:Language {name: $lang, used: $data})", lang=lang, data=data)

    def createRelationLangToUsers(self, user, langUsed):
        with self.driver.session() as session:
            print("Log: Creation of RelationShip between Lang and User")
            for lang in langUsed:
                session.run(
                    "MATCH (a:Person),(b:Language) WHERE a.name = $user AND b.name = $lang CREATE (a)-[r:RELANG]->(b)", user=user, lang=lang)

    def fetchNodesRelatedProfile(self):
        for user, data in self.profile["relations"].items():
            self.createRelationUser(user, data)
            self.createRelationLangToUsers(user, data["langs"])

    def fetchNodesLanguage(self):
        for lang, amount in self.profile["language"].items():
            if amount > 1:
                self.createNodeLang(lang, amount)


test = GraphDB({
    'relations': {
        'ShLaYa': {'count': 2, 'first_interac': datetime.datetime(2013, 7, 10, 16, 17, 54), 'langs': ['fr']},
        'Fnatic_sOAZ': {'count': 3, 'first_interac': datetime.datetime(2013, 7, 21, 18, 30, 29), 'langs': ['ca', 'en']},
    },
    'language': {'fr': 54, 'ca': 2, 'en': 39, 'de': 3, 'af': 3, 'fi': 2, 'nl': 1, 'ro': 1, 'da': 1, 'et': 1, 'pt': 1, 'vi': 1, 'sq': 1, 'id': 1},
    "profileUser": "RossetPaul"
})
test.fetchNodesRelatedProfile()
