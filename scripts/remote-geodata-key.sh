#!/usr/bin/env bash
grep '^API_KEYS=' /home/aura/Data-Historica-Microservicios/.env | cut -d= -f2- | tr -d '"'
