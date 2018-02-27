# chess backend
backend of chess game and chat made with express
the project includes: Node.js,Express,mongoDB.
backend keeps tracks of games and is responsible to enable communications between clients. 
### how to install and run:

## install necessary modules
first,clone the repositery using github instructions.
using cmd,with npm install type "npm i" to install modules.

## setting up mongoDB
*used for signup and login only!the project can be run without it.
run mongodb and create a database named "chessDb".Afterwards in that
database create a new collection named "users".

## run the server
then,open cmd in the path of the files,and type 
"npm run start" -this will start the server on the local computer