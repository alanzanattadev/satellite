#!/usr/bin/python

import numpy


def fromInt64ToInt(o):
    if isinstance(o, numpy.int64):
        return int(o)
    raise TypeError
