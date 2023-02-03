import os
from elasticsearch import Elasticsearch

es_client = Elasticsearch(
    os.getenv("ELASTICSEARCH_NODE"),
    basic_auth=[
        os.getenv("ELASTICSEARCH_USERNAME"),
        os.getenv("ELASTICSEARCH_PASSWORD"),
    ],
    verify_certs=False,
    ssl_show_warn=False,
)
