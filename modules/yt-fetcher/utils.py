#!/usr/bin/python


def insertOne(entryToSave, CollectionDep):
    try:
        return CollectionDep.insert_one(entryToSave).inserted_id
    except Exception as err:
        print err
