#!/bin/sh

juju deploy ./
juju add-relation kafka smaster
juju expose smaster
