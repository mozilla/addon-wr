FROM ubuntu:16.04
WORKDIR /share-button-study

RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update -y && \
    apt-get install -y firefox zip xvfb nodejs yarn xsel git ssh openbox bzip2 && \
    npm install -g get-firefox && \
    get-firefox -b beta -t /firefox.tar.bz2 && tar -xvjf /firefox.tar.bz2 -C /

ENV PATH="/share-button-study/node_modules/.bin:$PATH"
