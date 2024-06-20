FROM docker.io/mobiledevops/android-sdk-image:34.0.1
RUN apt update && apt install -y wget
ENV NODEJS_HOME="/opt/node"
RUN mkdir $NODEJS_HOME && \
    wget --quiet -O - https://nodejs.org/dist/v22.3.0/node-v22.3.0-linux-x64.tar.xz \
    | tar -xJf - --strip-components=1 --no-same-owner -C $NODEJS_HOME
ENV PATH="${PATH}:${NODEJS_HOME}/bin"
RUN npm install -g cordova
COPY ./build.sh /
WORKDIR /app
CMD ["/build.sh"]
