import happn
import time, os, random, math
from neo4j.v1 import GraphDatabase

token = os.getenv('HAPPN_TOKEN', None)
if (token == None):
    print('HAPPN_TOKEN env variable is not defined')
    exit(1)
neo4jUrl = os.getenv('NEO4J_URL', 'bolt://localhost')
neo4jUser = os.getenv('NEO4J_USER', 'neo4j')
neo4jPass = os.getenv('NEO4J_PASS', 'neo4j')
targetID = os.getenv('HAPPN_ID', '')
area = os.getenv('HAPPN_AREA', None)

def updateProfile(tx, profile):
    result = tx.run('MERGE (user:Happn { id: {id} })\
  ON CREATE SET user = {profile}, user.createdAt = timestamp()\
  ON MATCH SET user = {profile}, user.updatedAt = timestamp()\
  RETURN user.username', id=profile['id'], profile=profile)
    return result.single()[0]

def insertLocation(tx, location):
    result = tx.run('MERGE (location: Location { lat: {lat}, lon: {lon} })\
  RETURN location.name', lat=location['lat'], lon=location['lon'])
    return result.single()[0]

def linkLocation(tx, data):
    newLocation = {
        'lat': data['location']['lat'],
        'lon': data['location']['lon']
    }
    result = tx.run('MATCH (user:Happn { id: {id} }), (location:Location { lat: {lat}, lon: {lon}})\
  CREATE (user)-[r:LOCATED { date: {date} }]->(location)\
  RETURN location.name', id=data['profile']['id'], date=data['location']['date'],
    location=newLocation, lat=newLocation['lat'], lon=newLocation['lon'])
    return result.single()[0]

def saveData(profile, location):
    print('Insert location for profile with id:', profile['id'])
    driver = GraphDatabase.driver(neo4jUrl, auth=(neo4jUser, neo4jPass))

    with driver.session() as session:
        session.write_transaction(updateProfile, profile)
        session.write_transaction(insertLocation, location)
        session.write_transaction(linkLocation, { 'profile': profile, 'location': location })
    return driver.close()


me = happn.User(token)
# Parse location area
move = 0.001 # 0,001 (~= 100m) move in 10s ~= 40km/h
if (area != None):
    splited = area.split(':')
    if (len(splited) != 2 and len(splited) != 3):
        print('Bad area description, must be <lat>:<lon>[:<distance in coord>]')
        exit(1)
    area = {
        'lat': float(splited[0]),
        'lon': float(splited[1]),
        'distance': (None if len(splited) == 2 or float(splited[2]) < move else float(splited[2]))
    }
    position = { 'lat': area['lat'], 'lon': area['lon'] }
    random.seed()
    me.set_device()
    print('Search in', area)

alreadyseen = []
while True:
    print('Get new NEAR_YOU notifications')
    recs = me.get_recommendations()
    for rec in recs:
        if (rec['notification_type'] == 'NEAR_YOU'):
            target = rec['notifier']
            if (len(targetID) == 0 or targetID == target['id']):
                targetInfos = me.get_targetinfo(target['id'])
                profile = {
                    'id': targetInfos['id'],
                    'age': targetInfos['age'],
                    'gender': targetInfos['gender'],
                    'firstname': targetInfos['first_name'],
                    'profile_modification_date': targetInfos['modification_date'],
                    'pictures': map(lambda x: x['url'], targetInfos['profiles'])
                }
                location = {
                    'lat': round(target['last_meet_position']['lat'], 3),
                    'lon': round(target['last_meet_position']['lon'], 3),
                    'date': target['last_meet_position']['modification_date']
                }
                seen = profile['id'] + location['date']
                if seen not in alreadyseen:
                    saveData(profile, location)
                    alreadyseen.append(seen)
    time.sleep(5)
    if (area != None):
        dir = random.randint(0, 3)
        isOk = False
        while isOk == False:
            newPosition = position
            if (dir < 2):
                newPosition['lat'] += (move if dir == 0 else -move)
            else:
                newPosition['lon'] += (move if dir == 2 else -move)
            distanceFromCenter = math.sqrt((newPosition['lat'] - area['lat']) ** 2 + (newPosition['lon'] - area['lon']) ** 2)
            if (area['distance'] == None or distanceFromCenter < area['distance']):
                isOk = True
        print('Move to position', position)
        me.set_position(position['lat'], position['lon'])
    time.sleep(5)
