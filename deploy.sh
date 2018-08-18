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
        RET="$?"
        if [ $RET != "0" ] && [ "$2" == "" ]; then
            printf "${RED}Command: '$1' failed..${STD}\n"
            printf "${RED}To resume deploy from this step, execute '$0 $ACTUAL_STEP'${STD}\n"
            exit 1
        elif [ $RET != "0" ]; then
            printf "${RED}Command: '$1' failed..${STD}\n"
            printf "${CYAN}Will check '$2' and retry${STD}\n"
            # Wait for file
            while [ "$(test -e $2 ; echo $?)" == "1" ]; do
                sleep 1
            done
            # Add permissions to file
            sh -c "sudo chmod o+rw  $2"
            printf "${CYAN}Run: '$1' ${STD}\n"
            sh -c "$1"
            if [ $? != 0 ]; then
                printf "${RED}Command: '$1' failed..${STD}\n"
                printf "${RED}To resume deploy from this step, execute '$0 $ACTUAL_STEP'${STD}\n"
                exit 1
            fi
        fi
    fi
    ACTUAL_STEP=$((ACTUAL_STEP+1))
}

printf "${GREEN}Start deployment, we may ask your sudo password${STD}\n"
SUDO_LINE="`whoami` ALL=(ALL:ALL) NOPASSWD:ALL"
ACTUAL_SUDO=$(sudo cat /etc/sudoers | grep "$SUDO_LINE")
if [[ "$ACTUAL_SUDO" == "" ]]; then
    run_cmd "sudo sh -c \"echo \\\"$SUDO_LINE\\\" >> /etc/sudoers\""
fi

run_cmd "sudo snap install conjure-up --classic"
run_cmd "sudo snap install lxd"
run_cmd "/snap/bin/lxd init --preseed < $(dirname "$0")/config/lxd-init-preseed.yaml" "/var/snap/lxd/common/lxd/unix.socket"

run_cmd "sudo apt install python-pip -y"
run_cmd "pip install juju-wait"

run_cmd "conjure-up kubernetes-core localhost"

run_cmd "juju deploy cs:kafka-40"
run_cmd "juju deploy cs:zookeeper-42"
run_cmd "juju deploy cs:filebeat-18"
run_cmd "juju deploy cs:mongodb-48"
run_cmd "juju deploy cs:~jamesbeedy/vault-13"
run_cmd "juju deploy cs:~jacekn/docker-registry-0"

run_cmd "juju add-relation kafka zookeeper"
run_cmd "juju add-relation kubernetes-worker docker-registry"
run_cmd "juju add-relation kubernetes-master filebeat"
run_cmd "juju add-relation kubernetes-worker filebeat"
run_cmd "juju add-relation kafka filebeat"
run_cmd "juju config filebeat kube_logs=True"
run_cmd "juju config kubernetes-master enable-dashboard-addons=False client_password=\"admin\""

run_cmd "juju deploy $(dirname "$0")/charms/layers/neo4j"

if [ $ACTUAL_STEP -lt $RESUME_STEP ]; then
    printf "${GREEN}Deployment in progress, wait for the Docker Registry, see 'juju status'${STD}\n"
    juju wait
    while [ "$?" != "0" ]; do
        juju wait
    done
fi

REGISTRY_IP=$(juju status --format=yaml | sed -e '/docker-registry:/,/public-address/!d' | tr -d '\n' | sed -e 's/.*public-address: //')

run_cmd "$(dirname "$0")/docker.sh $REGISTRY_IP"
run_cmd "sudo docker build -t smaster:1.0 $(dirname "$0")/master"
run_cmd "echo \"docker push $REGISTRY_IP:5000/smaster\""
run_cmd "echo \"docker pull $REGISTRY_IP:5000/smaster\" >> $(dirname "$0")/charms/smaster/hooks/install"

run_cmd "juju deploy $(dirname "$0")/charms/smaster"
run_cmd "juju add-relation neo4j smaster"
run_cmd "juju add-relation mongodb smaster"
run_cmd "juju add-relation kafka smaster"
run_cmd "juju add-relation kubernetes-master smaster"
run_cmd "juju add-relation vault smaster"
run_cmd "juju expose smaster"

# PLUGINS

if [ $ACTUAL_STEP -lt $RESUME_STEP ]; then
    printf "${GREEN}Deployment in progress, wait for the Satellite Master and plugins build${STD}\n"
    juju wait
    while [ "$?" != "0" ]; do
        juju wait
    done
fi

printf "${GREEN}Deployment succeed!${STD}\n"

MASTER_IP=$(juju status --format=yaml | sed -e '/smaster:/,/public-address/!d' | tr -d '\n' | sed -e 's/.*public-address: //')

printf "${CYAN}Install the Satellite CLI with 'sudo snap install satellite'${STD}\n"
printf "${CYAN}To run the CLI: 'satellite.cli -s $MASTER_IP'${STD}\n"
