# Step 1: Set up the base image for building the Vue.js frontend
FROM node:18 AS build-stage

# Set the working directory for building the Vue.js app
WORKDIR /app

# Copy the package.json and package-lock.json for installing dependencies
COPY client/package.json client/package-lock.json ./client/

# Install dependencies for the Vue.js app
RUN cd client && npm install

# Copy the entire client folder and build the Vue.js app
COPY client /client

# Build the Vue.js app
RUN cd /client && npm run build

# Step 2: Set up the production image for running the app
FROM node:18 AS production-stage

# Set the working directory for the Express backend
WORKDIR /app

# Install only the necessary dependencies for the Express backend
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the entire project files into the production container
COPY . .

# Copy the built Vue.js app from the build stage to the correct location in the production container
COPY --from=build-stage /client/dist /app/client/dist

# Expose the port on which the Express app will run
EXPOSE 3000

# Start the Express server when the container starts
CMD ["node", "app.js"]
