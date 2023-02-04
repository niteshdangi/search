from elasticsearch import Elasticsearch
from bs4 import BeautifulSoup
from queue import Queue, Empty
from concurrent.futures import ThreadPoolExecutor
import requests
from time import sleep
from datetime import datetime
from src.scraper import scrapeData


class Crawler:
    def __init__(self, es_client: Elasticsearch):
        self.es_client = es_client
        self.pool = ThreadPoolExecutor(max_workers=5)
        self.crawl_queue = Queue()
        self.max_depth = 1
        self.count = 0

    def addToQueue(self, url, depth):
        try:
            if depth > self.max_depth and self.count > 150:
                return
            # res = self.es_client.exists(index="data", id=url)
            # crawlTime = True
            self.count += 1
            # if res.body:
            #     res = self.es_client.get(index="data", id=url)
            #     crawlTime = res.body.get("_source", {}).get(
            #         "timestamp", datetime.timestamp(datetime.now())
            #     )
            #     crawlTime = datetime.fromtimestamp(crawlTime)
            #     crawlTime = crawlTime - datetime.now()
            #     crawlTime = crawlTime.days >= 2
            # if crawlTime:
            print("Adding URL {} to queue".format(url))
            self.es_client.index(
                index="crawler_status",
                document={
                    "url": url,
                    "start_time": datetime.now(),
                    "status": "QUEUE",
                },
                id=url,
            )
            self.crawl_queue.put({"url": url, "depth": depth})
        except Exception as e:
            print(e)

    def post_scrape_callback(self, res):
        result = res.result()
        if result and result["res"].status_code == 200:
            self.es_client.index(
                index="crawler_status",
                document={
                    "url": result["obj"]["url"],
                    "start_time": datetime.now(),
                    "status": "PROCESS",
                },
                id=result["obj"]["url"],
            )
            soup = BeautifulSoup(result["res"].text, "html.parser")
            data = scrapeData(soup, result["obj"], self.es_client)
            self.es_client.index(
                index="crawler_status",
                document={
                    "url": result["obj"]["url"],
                    "start_time": datetime.now(),
                    "status": "DONE",
                },
                id=result["obj"]["url"],
            )
            if data:
                for url in data["queue"]:
                    self.addToQueue(url, result["obj"]["depth"] + 1)
                # for image in data["images"]:

            self.count -= 1
        else:
            self.es_client.index(
                index="crawler_status",
                document={
                    "url": result["obj"]["url"],
                    "start_time": datetime.now(),
                    "status": "FAILED",
                },
                id=result["obj"]["url"],
            )

    def scrape_page(self, obj):
        try:
            print("Scraping URL: {}".format(obj["url"]))
            self.es_client.index(
                index="crawler_status",
                document={
                    "url": obj["url"],
                    "start_time": datetime.now(),
                    "status": "FETCHING",
                },
                id=obj["url"],
            )
            res = requests.get(obj["url"], timeout=(3, 30), verify=False)
            return {"res": res, "obj": obj}
        except requests.RequestException as e:
            self.es_client.index(
                index="crawler_status",
                document={
                    "url": obj["url"],
                    "start_time": datetime.now(),
                    "status": "FAILED",
                    "data": str(e),
                },
                id=obj["url"],
            )
            print(e)
            return

    def check_url_in_elastic(self):
        res = self.es_client.search(index="crawler_queue", query={"match_all": {}})
        for url in res.body.get("hits", {}).get("hits", []):
            self.addToQueue(url["_source"]["url"], 0)
        return res.body.get("hits", {}).get("total", {}).get("value", 0)

    def run_web_crawler(self):
        while True:
            try:
                target_url = self.crawl_queue.get(timeout=10)
                if target_url:
                    print("Added URL: {}".format(target_url))
                    job = self.pool.submit(self.scrape_page, target_url)
                    job.add_done_callback(self.post_scrape_callback)
                    sleep(0.5)

            except Empty:
                print("Queue Empty, Checking for new URLs in Elastic")
                newCount = self.check_url_in_elastic()
                self.es_client.delete_by_query(
                    index="crawler_queue", query={"match_all": {}}
                )
                if newCount == 0:
                    self.count = 0
                    print("Elastic Queue Empty")
                    sleep(10)
                continue
            except Exception as e:
                print(e)
                continue
