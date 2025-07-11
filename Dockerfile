FROM node:16

# Create app directory
WORKDIR /app/api

# Install app dependenciesss
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install --legacy-peer-deps
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]