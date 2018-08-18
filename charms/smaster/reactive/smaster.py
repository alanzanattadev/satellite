from charms.reactive import when, when_not, set_state
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
