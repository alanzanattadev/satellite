import happn
import pprint
import time

token = ''
me = happn.User(token)

def saveData(profile, location):
    pprint.pprint(profile)
    pprint.pprint(location)
    return

alreadyseen = []
targetID = ''

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
