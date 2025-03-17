#!/bin/bash

# Generate private key in PKCS#8 format
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Extract public key
openssl pkey -in private_key.pem -pubout -out public_key.pem
