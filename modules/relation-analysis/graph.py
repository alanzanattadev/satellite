#!/usr/bin/python

import os
from neo4j.v1 import GraphDatabase
import datetime
from utils import fromUtf8ToAscii


class GraphDB:
    def __init__(self, profileAfterProcess):
        self.uri = os.environ.get("NEO_URI", "bolt://localhost:7687")
        self.user = os.environ.get("NEO_USER", "neo4j")
        self.password = os.environ.get("NEO_PASS", "polo")
        self.driver = GraphDatabase.driver(
            self.uri, auth=(self.user, self.password))
        self.profile = profileAfterProcess
        self.owner = fromUtf8ToAscii(profileAfterProcess["profileUser"])
        self.createOneNodeRelation(
            self.owner, "Log: Creation of mother User...")
        self.fetchNodesLanguage()

    def createOneNodeRelation(self, name, msglog):
        with self.driver.session() as session:
            print(msglog)
            return session.run("MERGE (a:TwitterAccount {name: $name}) ON CREATE SET a.name = $name", name=fromUtf8ToAscii(name))

    def createNodeLang(self, lang, data):
        with self.driver.session() as session:
            print("Log: Creation of Lang node " + lang)
            return session.run("MERGE (a:Language {name: $lang, nbOfUse: $nbOfUse}) ON CREATE SET a.name = $lang ON CREATE SET a.nbOfUse = $nbOfUse", lang=fromUtf8ToAscii(lang), nbOfUse=data)

    @staticmethod
    def createRelationUser(tx, user, data, owner):
        print("Log: Creation of User relation " +
              fromUtf8ToAscii(user))
        return tx.run("MATCH (a:TwitterAccount) WHERE a.name = $nameA MERGE (b:TwitterAccount {name: $nameB})-[r:RELATION {interactions: $interac, first_interaction: $firstI}]->(a) ON CREATE SET b.name = $nameB", nameA=owner, nameB=fromUtf8ToAscii(user), interac=data["count"], firstI=data["first_interac"])

    @staticmethod
    def createRelationLangToUsers(tx, user, lang):
        print("Log: Creation of RelationShip between Lang and User")
        return tx.run(
            "MATCH (a:TwitterAccount),(b:Language) WHERE a.name = $user AND b.name = $lang MERGE (a)-[r:RELANG]->(b)", user=fromUtf8ToAscii(user), lang=fromUtf8ToAscii(lang))

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
