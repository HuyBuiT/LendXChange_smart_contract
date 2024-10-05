#! /bin/bash
source .env
echo "Start build" >> $LOG_PATH
sui move build >> $LOG_PATH
echo "Start publish" >> $LOG_PATH
sui client publish --gas-budget 300000000 --skip-dependency-verification >> $LOG_PATH
