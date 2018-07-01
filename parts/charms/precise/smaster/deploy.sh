#!/bin/sh

juju deploy cs:vault-1
juju deploy ./
juju add-relation kafka smaster
juju add-relation kubernetes-master smaster
juju add-relation vault smaster
juju expose smaster
