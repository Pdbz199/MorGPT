# We use node:18.15.0 as the base image for building the image
FROM node:18.15.0

# Copy the code to the working directory
COPY ./ ./project

# Install all the dependencies required to run the application
WORKDIR /project
RUN npm i

# The command required to run the Dockerized application
CMD ["npx", "ts-node", "./src/main.ts"]