#!/usr/bin/env bash
export ROOT_URL='https://qurious.cc'
(cd /home/ubuntu/Sites/qurious && exec meteor run --settings settings.json --production)
