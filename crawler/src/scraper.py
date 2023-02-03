from bs4 import BeautifulSoup
import json
from .robots import Robots
from .utils import formatUrl, getUniqueUrlForQueue, check_remote_image
from elasticsearch import Elasticsearch
from urllib3.util import parse_url, Url
from datetime import datetime
from time import sleep


def scrapeData(soup: BeautifulSoup, obj: dict, es_client: Elasticsearch):
    data = {}
    meta = getMetaTags(soup)
    robots = Robots(getArrayFromString(meta.get("robots", "")))
    if robots.canIndex():
        parsedUrl = parse_url(obj.get("url"))
        data["url"] = obj.get("url")
        data["meta"] = meta
        data["title"] = (soup.find("title")).get_text()
        data["openGraph"] = getOg(soup)
        jsonSchema = getJsonSchema(soup)
        data["data"] = jsonSchema
        data["description"] = (
            meta.get("description", "")
            or jsonSchema.get("description", "")
            or data.get("openGraph").get("description", "")
        )
        data["breadcrumbs"] = getBreadCrumbs(jsonSchema)
        data["headings"] = getHeadings(soup)
        data["timestamp"] = datetime.timestamp(datetime.now())
        internalLinks = (
            getInternalLinks(soup, parsedUrl) if robots.canOpenLink() else []
        )
        externalLinks = (
            getExternalLinks(soup, parsedUrl) if robots.canOpenLink() else []
        )
        contextualLinks = (
            getContextualLinks(soup, parsedUrl) if robots.canOpenLink() else []
        )
        divLinks = getDivLinks(soup, parsedUrl) if robots.canOpenLink() else []
        images = getImages(soup, parsedUrl) if robots.canIndexImages() else []
        videos = getVideos(soup, parsedUrl)
        data["paragraph"] = [a.get_text() for a in soup.find_all("p")]
        if (
            not obj["url"].startswith("https://google.com/search?q=")
            and data["title"]
            and data["description"]
        ):
            es_client.index(index="data", document=data, id=data.get("url"))
            for img in images:
                if img.get("src"):
                    if check_remote_image(img.get("src")):
                        es_client.index(
                            index="images",
                            document={
                                "src": img["src"],
                                "alt": img.get("alt", None),
                                "title": data["title"],
                            },
                            id=img["src"],
                        )
                        sleep(0.1)

            for video in videos:
                if video.get("src"):
                    if check_remote_image(video.get("src")):
                        es_client.index(
                            index="videos",
                            document={
                                "src": video["src"],
                                "alt": video.get("alt", None),
                                "title": data["title"],
                            },
                            id=video["src"],
                        )
                        sleep(0.1)
        print("URL crawled: {}".format(data.get("url")))
        return {
            "queue": getUniqueUrlForQueue(
                [
                    *internalLinks,
                    *externalLinks,
                    *contextualLinks,
                    *divLinks,
                ],
                "google"
                if obj["url"].startswith("https://google.com/search?q=")
                else None,
            )
        }
    return None


def getMetaTags(soup: BeautifulSoup):
    tags = {}
    for tag in soup.find_all("meta"):
        if tag.get("name") and tag.get("content"):
            tags[tag.get("name")] = tag.get("content")
    return tags


def getOg(soup: BeautifulSoup):
    properties = {}
    for property in soup.select("meta[property^=og]"):
        if property.get("property") and property.get("content"):
            properties[property.get("property").replace("og:", "")] = property.get(
                "content"
            )
    return properties


def getJsonSchema(soup: BeautifulSoup):
    json_schema = soup.find("script", attrs={"type": "application/ld+json"})
    try:
        if json_schema:
            return fixJSONLD(json.loads(json_schema.get_text()))
    except Exception as e:
        return {}
    return {}


def getArrayFromString(content: str):
    return content.split(",")


def getBreadCrumbs(jsonSchema: dict):
    if jsonSchema.get("@graph", None):
        graph = jsonSchema.get("@graph")[3] if jsonSchema.get("@graph")[3] else {}
        return [x for x in graph.get("itemListElement")]
    return []


def getHeadings(soup: BeautifulSoup):
    headings = {}
    headers = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
    for x in headers:
        headings[str(x)[1:3]] = x.get_text()
    return headings


def getInternalLinks(soup: BeautifulSoup, parsedUrl: Url):
    return [
        {"name": a.get_text(), "link": formatUrl(a.get("href"), parsedUrl.host)}
        for a in soup.find_all("a", href=True)
        if (parsedUrl.host in a.get("href") or a.get("href").startswith("/"))
        and "nofollow" not in str(a)
        and a.get_text()
    ]


def getExternalLinks(soup: BeautifulSoup, parsedUrl: Url):
    return [
        {"name": a.get_text(), "link": formatUrl(a.get("href"), parsedUrl.host)}
        for a in soup.find_all("a", href=True)
        if (parsedUrl.host in a.get("href") or not a.get("href").startswith("/"))
        and "nofollow" not in str(a)
        and a.get_text()
    ]


def getContextualLinks(soup: BeautifulSoup, parsedUrl: Url):
    return [
        {"name": a.get_text(), "link": formatUrl(a.get("href"), parsedUrl.host)}
        for x in soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6"])
        for a in x.find_all("a", href=True)
        if "nofollow" not in str(a) and a.get_text()
    ]


def getDivLinks(soup: BeautifulSoup, parsedUrl: Url):
    return [
        {"name": a.get_text(), "link": formatUrl(a.get("href"), parsedUrl.host)}
        for x in soup.find_all(["div", "span"])
        for a in x.find_all("a", href=True)
        if "nofollow" not in str(a) and a.get_text()
    ]


def getImages(soup: BeautifulSoup, parsedUrl: Url):
    return [
        {"src": formatUrl(a.get("src"), parsedUrl.host), "alt": a.get("alt")}
        for a in soup.find_all("img")
    ]


def getVideos(soup: BeautifulSoup, parsedUrl: Url):
    return [
        {"src": formatUrl(a.get("source"), parsedUrl.host)}
        for a in soup.find_all("video")
    ]


def fixJSONLD(jsonSchema: dict):
    if not jsonSchema:
        return {}
    return {
        **jsonSchema,
        "logo": {"url": jsonSchema.get("icon", "")}
        if type(jsonSchema.get("icon", {})) == str
        else jsonSchema.get("icon", {}),
        "type": jsonSchema.get("@type"),
    }
