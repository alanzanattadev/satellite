#!/usr/bin/env python3
# Copyright (C) 2017  Qrama
# Copyright (C) 2017  Ghent University
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
import subprocess

from jujubigdata import utils
from charmhelpers.core import hookenv
from charmhelpers.core.host import service_restart
from charmhelpers.core.hookenv import (
    open_port,
    status_set,
)
from charms.reactive import hook, when, when_not, set_state, remove_state


@hook('upgrade-charm')
def upgrade_charm():
    hookenv.log("Upgrading neo4j Charm")
    remove_state('neo4j.configured')


@when(
    'apt.installed.python-pip',
    'apt.installed.neo4j')
@when_not('neo4j.configured')
def configure_neo4j():
    print("Configuring Neo4j")
    initial_config()
    install_python_deps()
    service_restart('neo4j')
    open_port(7474)
    open_port(7687)
    status_set('active', 'Ready')
    set_state('neo4j.configured')


@when('neo4j.configured')
@when('config.changed.python-type')
def install_python_driver():
    print("python deps changed, installing new ones..")
    install_python_deps()


##################
# Config methods #
##################
def initial_config():
    utils.re_edit_in_place('/etc/neo4j/neo4j.conf', {
        r'^#?dbms.connectors.default_listen_address=([0-9].[0-9].[0-9].[0-9]|)$':
            'dbms.connectors.default_listen_address=0.0.0.0'
    })


def install_python_deps():
    conf = hookenv.config()
    python_type = conf['python-driver-type']
    if python_type != 'none':
        subprocess.check_call(['pip', 'install', python_type])
