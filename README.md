# Revocation authority`s App
Web application for revocation authority of RKVAC (Revocable Keyed-Verification Anonymous Credentials) scheme.

## Dependencies:
- nodeJS, npm
- WebCard: https://github.com/cardid/webcard

## Installation:
* Download the web application to the server.
* Install all dependencies for RKVAC application.
* Follow the instructions for debugging RKVAC application with these specialties:
  * there is no need to patch pcsc library, due to the remote communication with the card
  * build option for remote communication with ID card should be set to `-DRKVAC_PROTOCOL_REMOTE`
  * TCP port for communication between RKVAC and web application needs to be set in the header file to 5001. The port can be specified before debugging in the header file
* Copy the RKVAC executable to the parent folder of web application.
  * The executable should be named `rkvac-protocol-multos-1.0.0`.
* Run server using:
  `npm run serverstart`
* Connect to web server using address https://<server-address>:9443/
  `npm run serverstart`
- server runs on https://localhost:9443

## Usage:
* See diploma_manual.pdf