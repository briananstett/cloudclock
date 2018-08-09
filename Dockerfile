FROM node:8.11.3-alpine
COPY ./ /cloudclock
WORKDIR /cloudclock
CMD npm start