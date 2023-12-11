FROM python:3.10-alpine

WORKDIR /ContainerFiles

RUN pip3 install --upgrade pip

RUN apk update \
    && apk add --virtual build-deps gcc python3-dev musl-dev \
    && apk add --no-cache mariadb-dev

RUN pip install mysqlclient  

RUN apk del build-deps

COPY ./ContainerFiles/requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY ./ContainerFiles/entrypoint.sh entrypoint.sh

EXPOSE 80
 