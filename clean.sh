#! /bin/bash

CONTROLLER=$(juju controllers --refresh | grep conjure-up | sed 's/*.*//')
MODEL=$(juju controllers --refresh | grep conjure-up | cut -d ' ' -f 3)

echo "Controller detected: $CONTROLLER"
echo "Model detected: $MODEL"

juju destroy-model admin/$MODEL -y
juju destroy-controller $CONTROLLER -y

/snap/bin/lxc profile delete juju-controller
/snap/bin/lxc profile delete juju-$MODEL
/snap/bin/lxc profile delete default
/snap/bin/lxc network delete lxdbr0
/snap/bin/lxc storage delete juju-btrfs 
/snap/bin/lxc storage delete juju-zfs
/snap/bin/lxc storage delete default

echo "Remove juju wait"
pip uninstall juju-wait -y

echo "Remove LXD and Conjure-up snap"
sudo snap remove lxd
sudo snap remove conjure-up