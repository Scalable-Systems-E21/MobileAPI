FROM node:12-alpine

# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
COPY tslint.json ./
# copy source code to /app/src folder
COPY src /app/src/

# check files list
RUN ls -a

RUN npm install
RUN npm run build

EXPOSE 8090

CMD [ "node", "./dist/index.js" ]