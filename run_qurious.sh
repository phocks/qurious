#!/usr/bin/env bash
#export ROOT_URL='https://qurious.cc'
(cd /home/ubuntu/Sites/qurious && exec ROOT_URL='https://qurious.cc' meteor run --settings settings.json --production)
