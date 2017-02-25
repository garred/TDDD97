import random


# Helper functions

letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
def generate_token():
    token = ""
    for _ in range(36):
        token = token + random.choice(letters)
    return token


print generate_token()