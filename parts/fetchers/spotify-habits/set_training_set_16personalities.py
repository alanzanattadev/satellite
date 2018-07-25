#!/usr/bin/env python3
import csv
import satellipy.configuration.mongo as MongoConf

if __name__ == '__main__':
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    collection = mongo_client['collections']['personalities']

    # Read CSV
    with open("training_set.csv", "r") as f:
        reader = csv.reader(f)
        for row in reader:
            id = row[0]
            personality_label = row[1]
            # Collection cleaning
            collection.delete_many({'user_id': id})
            # Insert row
            print("Inserting %s as %s" % (id, personality_label))
            collection.insert_one({
               'user_id': id,
               'personality_label': personality_label,
               'predicted': False,
            })
