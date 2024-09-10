# Floway BACK

## Installation

### Generate CERT
# generate a 2048-bit RSA key pair, and encrypts them with a passphrase
`openssl genrsa -des3 -out private.pem 2048`

# export the RSA public key to a file
`openssl rsa -in private.pem -outform PEM -pubout -out public.pem`
