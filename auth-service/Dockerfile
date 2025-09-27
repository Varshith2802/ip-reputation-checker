# Use a minimal Python image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Add wait-for-it.sh script to wait for the database service to be ready
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /usr/bin/wait-for-it.sh
RUN chmod +x /usr/bin/wait-for-it.sh

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Ensure start.sh has executable permissions and fix line endings for Linux
RUN sed -i 's/\r$//' start.sh
RUN chmod +x start.sh

# Expose port 8001
EXPOSE 8001

# Run the startup script
CMD ["/usr/bin/wait-for-it.sh", "mongodb:27017", "--", "./start.sh"]
