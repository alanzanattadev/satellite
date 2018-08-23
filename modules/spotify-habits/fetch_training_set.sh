#!/usr/bin/env bash

./set_training_set_16personalities.py $1 &&
./get_training_data.py
