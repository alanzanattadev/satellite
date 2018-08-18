from charms.reactive import when, when_not, set_state
#from subprocess import call
from charmhelpers.core.hookenv import relations, relation_ids, remote_unit


@when_not('smaster.installed')
def install_smaster():
    # Do your setup here.
    #
    # If your charm has other dependencies before it can install,
    # add those as @when() clauses above., or as additional @when()
    # decorated handlers below
    #
    # See the following for information about reactive charms:
    #
    #  * https://jujucharms.com/docs/devel/developer-getting-started
    #  * https://github.com/juju-solutions/layer-basic#overview
    #
    set_state('smaster.installed')


# @when('kubemaster.relation.joined')
# def setCluster_config():
#     relation = relations()
#     idKubeMaster = relation_ids()[0]
#     remoteUnit = remote_unit()
#     kubeMasterIP = relation["kubemaster"][idKubeMaster][remoteUnit]["private-address"]
#     call(["kubectl", "config", "set-cluster", "juju",
#           "--insecure-skip-tls-verify=true", "--server=http://" + kubeMasterIP])  # Get Kubemaster IP address.
#     set_state("kubemaster.relation.joined")
