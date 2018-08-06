personalities = [
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP"
]

def set_user_as_fetched(username, personalities_collection):
    personalities_collection.update_one({'user_id': username}, {'$set': {'processed': True}})
    print(".. Marked %s as processed" % (username))
