FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home --uid 10001 powwow
COPY powwow ./powwow
RUN mkdir -p /data/artifacts && chown -R powwow:powwow /data
USER powwow
EXPOSE 8000
CMD ["uvicorn", "powwow.main:app", "--host", "0.0.0.0", "--port", "8000"]

