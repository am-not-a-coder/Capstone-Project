
#Initializes the base image
FROM node:18

#Declares the working directory
WORKDIR /app

#copies the package.json
COPY package*.json ./

#Install all the dependencies
RUN npm install

#Copies all the files(excluding the files inside dockerignore)
COPY . .

#Declares the default port 
ENV PORT=3000

#Exposes port 5173 on the container
EXPOSE  3000

#Tells Docker to run 'npm run dev' when the container launches.
CMD ["npm" , "run", "dev"]

