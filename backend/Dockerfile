#USE python as base image
FROM python:3.11

#Set the working directory
WORKDIR /app

#Copy the required files
COPY requirements.txt ./

#Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

#Copy the rest of the code
COPY . .

#Expose the port 
EXPOSE 3000

CMD ["python", "run.py"]
