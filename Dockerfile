FROM node:16
WORKDIR /usr/app
COPY ./ /usr/app
RUN npm install
CMD ["npm", "start"]