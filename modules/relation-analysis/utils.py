#!/usr/bin/python

import numpy


def fromInt64ToInt(o):
    if isinstance(o, numpy.int64):
        return int(o)
    raise TypeError


def fromUtf8ToAscii(entry):
    return entry.encode("ascii", "ignore").decode()
