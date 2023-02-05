from elasticsearch import Elasticsearch
from bs4 import BeautifulSoup
from queue import Queue, Empty
from concurrent.futures import ThreadPoolExecutor
import requests
from time import sleep
from datetime import datetime
from src.scraper import scrapeData
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = webdriver.ChromeOptions()
options.add_argument("--headless")


class Crawler:
    def __init__(self, es_client: Elasticsearch):
        self.es_client = es_client
        self.pool = ThreadPoolExecutor(max_workers=10)
        self.crawl_queue = Queue()
        self.max_depth = 1
        self.count = 0

    def addToQueue(self, url, depth):
        try:
            if depth > self.max_depth or self.count > 150:
                return
            res = self.es_client.exists(index="data", id=url)
            crawlTime = True
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
        if result and result["res"]:
            self.es_client.index(
                index="crawler_status",
                document={
                    "url": result["obj"]["url"],
                    "start_time": datetime.now(),
                    "status": "PROCESS",
                },
                id=result["obj"]["url"],
            )
            soup = BeautifulSoup(result["res"], "html.parser")
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
            content = ""
            if "youtube.com/watch" in obj.get("url"):
                print("Opening WebDriver")
                driver = webdriver.Chrome(
                    executable_path="./crawler/chromedriver",
                    options=options,
                )
                driver.get(obj["url"])
                try:
                    print("Waiting WebDriver")
                    wait = WebDriverWait(driver, 30)
                    wait.until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "#scriptTag"))
                    )
                except Exception as e:
                    pass
                content = driver.page_source
                driver.close()
            else:
                res = requests.get(
                    obj["url"],
                    timeout=(3, 30),
                    verify=False,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
                    },
                )
                content = res.text
            print("DONE")

            return {"res": content, "obj": obj}
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
