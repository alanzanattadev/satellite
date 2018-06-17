# satellite

## Install

### Operating System

- Download and install Ubuntu 18.04 LTS
- `git clone https://github.com/alanzanattadev/satellite`
- `sudo snap install conjure-up --classic`
- `sudo snap install lxd`
- `sudo chmod o+rw /var/snap/lxd/common/lxd/unix.socket` (apparently not needed with Ubuntu Server)
- `/snap/bin/lxd init --preseed < ./satellite/parts/lxd/config/init-preseed.yaml`
- For headless Conjure-up configuration, must have a passwordless sudo:
  - With `visudo` change the line `%sudo ALL=(ALL:ALL) ALL` in `%sudo ALL=(ALL:ALL) NOPASSWD:ALL`
- `conjure-up kubernetes-core localhost` (this will take a lot of time...)
- Add Juju charms:
  - `juju deploy cs:~hazmat/trusty/kafka-1`
  - `juju deploy cs:~hazmat/trusty/zookeeper-0`
  - `juju add-relation kafka zookeeper`
  - `juju deploy cs:mongodb-48`
  - `juju deploy cs:neo4j-0`

You monitor units with `juju status` or via the web gui with `juju gui`.

#### Troubleshooting

- Cluster kubernetes down: juju destroy-model [TAB TAB]

## Contribute

### CLI

- Install build-essentials
- cd into parts/cli
- yarn
