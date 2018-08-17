#!/bin/sh

juju deploy cs:~jamesbeedy/vault-13
juju deploy ./layers/neo4j
juju deploy ./smaster
juju add-relation neo4j smaster
juju add-relation kafka smaster
juju add-relation kubernetes-master smaster
juju add-relation vault smaster
juju expose smaster
