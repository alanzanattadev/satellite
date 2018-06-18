#! /bin/bash

CYAN="\e[0;36m"
RED="\e[0;31m"
GREEN="\e[0;32m"
STD="\e[m"

ACTUAL_STEP="0"
RESUME_STEP="0"
if [ "$#" -ge "1" ] && [[ $1 =~ ^[0-9]+$ ]]; then
    RESUME_STEP="$1"
fi

run_cmd() {
    if [ $ACTUAL_STEP -lt $RESUME_STEP ]; then
        printf "${CYAN}Skiping: '$1'${STD}\n"
    else
        printf "${CYAN}Run: '$1' ${STD}\n"
        sh -c "$1"
        if [ $? != 0 ]; then
            printf "${RED}Command: '$1' failed..${STD}\n"
            printf "${RED}To resume deploy from this step, execute '$0 $ACTUAL_STEP'${STD}\n"
            exit 1
        fi
    fi
    ACTUAL_STEP=$((ACTUAL_STEP+1))
}

printf "${GREEN}Start deployment, we will ask your sudo password${STD}\n"
run_cmd "sudo sh -c \"echo \\\"`whoami` ALL=(ALL:ALL) NOPASSWD:ALL\\\" >> /etc/sudoers\""
run_cmd "sudo snap install conjure-up --classic"
run_cmd "sudo snap install lxd"
run_cmd "sudo chmod o+rw /var/snap/lxd/common/lxd/unix.socket"
run_cmd "/snap/bin/lxd init --preseed < ./parts/lxd/config/init-preseed.yaml"
run_cmd "conjure-up kubernetes-core localhost"
run_cmd "juju deploy cs:~hazmat/trusty/kafka-1"
run_cmd "juju deploy cs:~hazmat/trusty/zookeeper-0"
run_cmd "juju add-relation kafka zookeeper"
run_cmd "juju deploy cs:mongodb-48"
run_cmd "juju deploy cs:neo4j-0"
printf "${GREEN}Deployment succeed, see 'juju status'${STD}\n"
