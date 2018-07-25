import happn
import pprint
import time
import os
from neo4j.v1 import GraphDatabase

token = os.getenv('HAPPN_TOKEN', None)
if (token == None):
    print('HAPPN_TOKEN env variable is not defined')
    exit(1)
neo4jUrl = os.getenv('NEO4J_URL', 'bolt://localhost')
neo4jUser = os.getenv('NEO4J_USER', 'neo4j')
neo4jPass = os.getenv('NEO4J_PASS', 'neo4j')
targetID = os.getenv('HAPPN_ID', '')

def updateProfile(tx, profile):
    result = tx.run('MERGE (user:Happn { id: {id} })\
  ON CREATE SET user = {profile}, user.createdAt = timestamp()\
  ON MATCH SET user = {profile}, user.updatedAt = timestamp()\
  RETURN user.username', id=profile.get('id'), profile=profile)
    return result.single()[0]

def insertLocation(tx, location):
    newLocation = {
        'lat': location.get('lat'),
        'lon': location.get('lon')
    }
    result = tx.run('MATCH (user:Happn { id: {id} })\
  CREATE (user)-[r:LOCATED { date: {date} }]->(location:Location {location})\
  RETURN location.name', id=profile.get('id'), date=location.get('date'), location=newLocation)
    return result.single()[0]

def saveData(profile, location):
    print(profile, location)
    driver = GraphDatabase.driver('bolt://localhost', auth=('neo4j', 'test'))

    with driver.session() as session:
        session.write_transaction(updateProfile, profile)
        #session.write_transaction(insertLocation, location)
    return driver.close()

alreadyseen = []
me = happn.User(token)

while True:
    print('Get new NEAR_YOU notifications')
    recs = me.get_recommendations()
    for rec in recs:
        if (rec.get('notification_type') == 'NEAR_YOU'):
            target = rec.get('notifier')
            if (len(targetID) == 0 or targetID == target.get('id')):
                targetInfos = me.get_targetinfo(target.get('id'))
                profile = {
                    'id': targetInfos.get('id'),
                    'age': targetInfos.get('age'),
                    'gender': targetInfos.get('gender'),
                    'firstname': targetInfos.get('first_name'),
                    'profile_modification_date': targetInfos.get('modification_date'),
                    'pictures': map(lambda x: x.get('url'), targetInfos.get('profiles'))
                }
                location = {
                    'lat': round(target.get('last_meet_position').get('lat'), 3),
                    'lon': round(target.get('last_meet_position').get('lon'), 3),
                    'date': target.get('last_meet_position').get('modification_date')
                }
                seen = profile.get('id') + location.get('date')
                if seen not in alreadyseen:
                    saveData(profile, location)
                    alreadyseen.append(seen)
    time.sleep(5)
    # MOVE TO ANOTHER PLACE
    #me = me.set_position(20.0477203,-156.5052441) #Hawaii lat/lon
    time.sleep(5)
