#!/bin/sh

juju deploy cs:vault-1
juju deploy ./../layers/neo4j/
juju deploy ./
juju add-relation neo4j smaster
juju add-relation kafka smaster
juju add-relation kubernetes-master smaster
juju add-relation vault smaster
juju expose smaster
