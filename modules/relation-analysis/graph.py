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
        self.owner = profileAfterProcess["profileUser"].encode(
            "ascii", "ignore").decode()
        self.createOneNodeRelation(
            self.owner, "Log: Creation of mother User...")
        self.fetchNodesLanguage()

    def createOneNodeRelation(self, name, msglog):
        with self.driver.session() as session:
            print(msglog)
            return session.run("CREATE (a:TwitterAccount {name: $name})", name=name.encode("ascii", "ignore").decode())

    def createNodeLang(self, lang, data):
        with self.driver.session() as session:
            print("Log: Creation of Lang node " + lang)
            return session.run("CREATE (a:Language {name: $lang, used: $data})", lang=lang.encode("ascii", "ignore").decode(), data=data)

    @staticmethod
    def createRelationUser(tx, user, data, owner):
        print("Log: Creation of User relation " +
              user.encode("ascii", "ignore").decode())
        return tx.run("MATCH (a:TwitterAccount) WHERE a.name = $nameA CREATE (b:TwitterAccount {name: $nameB})-[r:RELATION {interactions: $interac, first_interaction: $firstI}]->(a)", nameA=owner, nameB=user.encode("ascii", "ignore").decode(), interac=data["count"], firstI=data["first_interac"].strftime("%d/%m/%Y"))

    @staticmethod
    def createRelationLangToUsers(tx, user, lang):
        print("Log: Creation of RelationShip between Lang and User")
        return tx.run(
            "MATCH (a:TwitterAccount),(b:Language) WHERE a.name = $user AND b.name = $lang CREATE (a)-[r:RELANG]->(b)", user=user.encode("ascii", "ignore").decode(), lang=lang.encode("ascii", "ignore").decode())

    def fetchNodesRelatedProfile(self):
        with self.driver.session() as session:
            for user, data in self.profile["relations"].items():
                session.write_transaction(
                    self.createRelationUser, user, data, self.owner)
                for lang in data["langs"]:
                    session.write_transaction(
                        self.createRelationLangToUsers, user, lang)

    def fetchNodesLanguage(self):
        for lang, amount in self.profile["language"].items():
            if amount > 1:
                self.createNodeLang(lang, amount)
