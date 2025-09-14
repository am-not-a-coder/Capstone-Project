#USE python as base image
FROM python:3.11

# Install system dependencies (for OCR)
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

#Set the working directory
WORKDIR /app

#Copy the required files
COPY requirements.txt ./

#Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

#Copy the rest of the code
COPY . .

#Expose the port 
EXPOSE 5000

CMD ["python", "run.py"]
