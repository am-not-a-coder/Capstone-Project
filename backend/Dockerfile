FROM python:3.11-slim

WORKDIR /app

 
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

    # Install Basic system dependencies
COPY requirements-base.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements-base.txt


    # Install Machine Learning dependencies
COPY requirements-ml.txt .
RUN --mount=type=cache,target=/root/.cache/pip \    
    pip install --no-cache-dir -r requirements-ml.txt

COPY . .

EXPOSE 5000

CMD ["python", "run.py"]
