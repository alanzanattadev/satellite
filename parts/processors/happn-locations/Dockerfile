FROM python:2
LABEL maintainer="jacqueslorentzdev@gmail.com"
WORKDIR /usr/src/app
RUN ["git", "clone", "https://github.com/rickhousley/happn"]
RUN ["pip", "install", "requests", "pprint", "logging", "argparse", "python-decouple"]
COPY script.py ./happn/
ENTRYPOINT ["python", "./happn/script.py"]
