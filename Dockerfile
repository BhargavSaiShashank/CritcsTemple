# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /code

# Copy the requirements file into the container at /code/
COPY requirements.txt /code/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the current directory contents into the container at /code/
COPY . /code/

# Use gunicorn with uvicorn workers for production (utilizing 16GB RAM with multiple workers)
# 4 workers is a safe start, could potentially go higher given the 16GB RAM.
# We bind to port 7860 as expected by Hugging Face Spaces by default.
CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:7860", "--timeout", "120", "--keep-alive", "5"]
