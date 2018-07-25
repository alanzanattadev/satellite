#!/usr/bin/env python3
import satellipy.configuration.mongo as MongoConf
import satellipy.utils.cli as CliUtils

if __name__ == '__main__':

    username = CliUtils.parse_username_from_args()
    label = CliUtils.parse_personality_from_args()
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    collection = mongo_client['collections']['personalities']

    # Collection cleaning
    print("Cleaning collection for user")
    collection.delete_many({'user_id': username})

    print("Inserting %s with label %s" % (username, label))
    collection.insert_one({
        'user_id': username,
        'personality_label': label,
        'predicted': False,
    })
