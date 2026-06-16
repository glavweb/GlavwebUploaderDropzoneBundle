#!/bin/bash
set -x
set -e

composer require -n $PACKAGE_NAME:dev-master \
&& php bin/phpunit \
|| echo 'FAILED'

../scripts/copy.sh
