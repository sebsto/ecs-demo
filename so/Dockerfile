FROM node:10.16

# Set work dir 
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY js/package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY js/*.js .

EXPOSE 8080
CMD [ "node", "server.js" ]
