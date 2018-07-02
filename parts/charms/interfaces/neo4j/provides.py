#!/usr/bin/env python

from charmhelpers.core import hookenv
from charms.reactive import set_flag, clear_flag
from charms.reactive import Endpoint

class NeoProvides(Endpoint):
    def publish_info(self, port, hostname=None):
        """
        Publish the port and hostname of the website over the relationship so
        it is accessible to the remote units at the other side of the
        relationship.

        If no hostname is provided, the unit's private-address is used.
        """
        for relation in self.relations:
            relation.to_publish['hostname'] = hostname or hookenv.unit_get('private_address')
            # Publishing data with `to_publish` is the only way to communicate
            # with remote units. Flags are local-only, they are not shared with
            # remote units!
            relation.to_publish['port'] = port
