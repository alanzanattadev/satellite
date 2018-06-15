# satellite

## Install

### Operating System

- Download and install Ubuntu 18.04 LTS
- sudo snap install conjure-up --classic
- sudo snap install lxd
- sudo chmod o+rw /var/snap/lxd/common/lxd/unix.socket
- /snap/bin/lxd init
  - storage type: dir
  - ipv6 address: none
  - everything else is default configuration
- conjure-up (kubernetes-core)

#### Troubleshooting

- Cluster kubernetes down: juju destroy-model [TAB TAB]

## Contribute

### CLI

- Install build-essentials
- cd into parts/cli
- yarn
