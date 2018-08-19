#! /bin/sh

# Send environement configuration to the satellite master

SMASTER="http://localhost:8000"

get_and_send_ip() {
    IP=$(juju status --format=yaml | sed -e "/$1:/,/public-address/!d" | tr -d '\n' | sed -e "s/.*public-address: //")
    curl -H "Content-Type: application/json" -X POST -d "{\"service\":\"$1\", \"host\":\"$IP\"}" "$SMASTER/config/$1"
}

get_and_send_ip "kafka"
get_and_send_ip "mongodb"
get_and_send_ip "neo4j"
get_and_send_ip "vault"