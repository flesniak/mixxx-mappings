#!/bin/bash

DEV="hw:3,0,0"
SAVETO="Numark_NDX800.js"
MIDICMD="B0"
MIDION="7F"
MIDIOFF="00"

for i in $(seq 0 255) ; do
  echo "Trying midi control ${i}"
  amidi -p "${DEV}" -S "${MIDICMD}$(printf '%02X' $i)${MIDION}"
  #read "REPLY?Element (empty to skip): "
  read -p "Element (empty to skip): "
  if [ -n "$REPLY" ] ; then
    echo "${REPLY}:${i}" >>"${SAVETO}"
  fi
  amidi -p "${DEV}" -S "${MIDICMD}$(printf '%02X' $i)${MIDIOFF}"
done
