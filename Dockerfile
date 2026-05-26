#Base Image
FROM node:24-alpine

#Working Directory
WORKDIR /app

#Copy Package Files
COPY package*.json yarn.lock ./

#Install Dependencies
RUN yarn install --frozen-lockfile --production

#Copy rest of the code
COPY . .

#Expose Port
EXPOSE 7005 

#Start the application
CMD ["node", "server.js"]