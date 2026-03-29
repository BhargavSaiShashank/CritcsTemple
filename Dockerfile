# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /code

# Copy only the requirements file first for layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt gunicorn uvicorn certifi

# Copy the backend code into the container
COPY ./app /code/app
COPY main.py /code/main.py

# Expose the app port
EXPOSE 10000

# Run with 1 worker for memory efficiency on free-tier servers
# Using the shell form of CMD to support the $PORT env variable provided by Render
CMD gunicorn app.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120 --keep-alive 5
