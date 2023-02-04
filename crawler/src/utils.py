from urllib.parse import urljoin
from urllib3.util import parse_url
import requests
import re


def formatUrl(url: str, host: str):
    if not url:
        return ""
    if url.startswith("data:"):
        return ""
    if url.startswith("http"):
        return url
    else:
        return urljoin("http://" + host, url)


def getUniqueUrlForQueue(links: list, hostExclusion: str):
    urls = []
    for link in links:
        if link["link"] not in urls and link["link"]:
            if hostExclusion:
                if link["link"].startswith("http://google.com/url?q="):
                    link["link"] = (
                        link["link"].split("http://google.com/url?q=")[1].split("&")[0]
                    )
                host = parse_url(link["link"]) or ""
                if hostExclusion in host.host:
                    print(link["link"])
                    continue
            urls.append(link["link"])
    return urls


def check_remote_image(image_url):
    response = requests.get(image_url)
    if response.status_code == 200:
        return True
    return False


def cleanText(text: str):
    if not text:
        return ""
    text = text.replace("\n", " ").replace("\t", " ")
    text = re.sub(" +", " ", text)
    text = re.sub(r"\[.*?\]", "", text)
    return text.strip()
