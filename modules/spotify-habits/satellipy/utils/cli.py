import sys
from satellipy import personalities

def parse_username_from_args():
    # Params parsing
    if len(sys.argv) > 1:
        username = sys.argv[1]
        print("Username: ", username)
        return username
    else:
        print("Enter username, you can get it by sharing from the mobile app")
        print("usage: python main.py [username]")
        sys.exit()


def parse_personality_from_args():
    if len(sys.argv) > 2:
        label = sys.argv[2]
        print("Label: ", label)
    try:
        index = personalities.index(label)
        return label
    except:
        print("The second argument has to be a valid personality")
        print("-----PERSONALITIES----")
        print(personalities)
        print("----------------------")
        sys.exit()
