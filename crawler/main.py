from dotenv import load_dotenv
from src.crawler import Crawler
from src.elasticClient import es_client

load_dotenv()

if __name__ == "__main__":
    cc = Crawler(es_client)
    cc.run_web_crawler()
