#!/usr/bin/env python3
# Copyright (C) 2016  Ghent University
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
# pylint: disable=c0111,c0103,c0301
import subprocess
import os

from jujubigdata import utils
from charmhelpers.core import hookenv
from charmhelpers.core.host import service_start, service_stop
from charmhelpers.core.hookenv import open_port, status_set
from charms.reactive import hook, when, when_not, set_state

import charms.apt # pylint: disable= e0401,e0611

@hook('upgrade-charm')
def upgrade_charm():
    hookenv.log("Upgrading neo4j Charm")
    try:
        service_stop('neo4j')
    except subprocess.CalledProcessError as exception:
        hookenv.log(exception.output)
    install()

@when('java.installed')
@when_not('apt.installed.python-pip')
def pre_install():
    hookenv.log("Install Python-pip")
    charms.apt.queue_install(['python-pip'])#pylint: disable=e1101

@when('java.installed', 'apt.installed.python-pip')
@when_not('neo4j.installed')
def install():
    hookenv.log("Installing Neo4J")
    conf = hookenv.config()
    open_port(conf['http-port'])
    charms.apt.queue_install(['neo4j'])#pylint: disable=e1101
    #install python driver if required
    python_type = conf['python-type']
    if python_type != 'none':
        subprocess.check_call(['pip', 'install', python_type])

@when('apt.installed.neo4j')
def config_bindings():
    try:
        service_stop('neo4j')
        configure_neo4j()
        service_start('neo4j')
        status_set('active', 'Ready')
        set_state('neo4j.installed')
    except subprocess.CalledProcessError as exception:
        hookenv.log(exception.output)

@when('config.changed.python-type')
def install_python_driver():
    conf = hookenv.config()
    if os.path.exists('/etc/neo4j'):
        configure_neo4j()
    python_type = conf['python-type']
    if python_type != 'none':
        subprocess.check_call(['pip', 'install', python_type])


##################
# Config methods #
##################
def configure_neo4j():
    conf = hookenv.config()
    utils.re_edit_in_place('/etc/neo4j/neo4j.conf', {
        r'#dbms.connector.http.address=0.0.0.0:7474': 'dbms.connector.http.address=0.0.0.0:{}'.format(conf['http-port']),
    })
    utils.re_edit_in_place('/etc/neo4j/neo4j.conf', {
        r'#dbms.connector.http.listen_address=:7474': 'dbms.connector.http.listen_address=:{}'.format(conf['http-port']),
    })
    utils.re_edit_in_place('/etc/neo4j/neo4j.conf', {
        r'#dbms.connector.https.listen_address=:7473': 'dbms.connector.https.listen_address=:{}'.format(conf['https-port']),
    })
