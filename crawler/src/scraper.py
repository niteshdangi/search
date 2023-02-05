from bs4 import BeautifulSoup
import json, re
from .robots import Robots
from .utils import formatUrl, getUniqueUrlForQueue, check_remote_image, cleanText
from elasticsearch import Elasticsearch
from urllib3.util import parse_url, Url
from datetime import datetime
from time import sleep

# import spacy

# nlp = spacy.load("en_core_web_sm")


# def determine_text_quality(text):
#     doc = nlp(text)
#     grammar_errors = 0
#     readability_score = 0
#     for token in doc:
#         if token.dep_ not in ("ROOT", "punct"):
#             if token.pos_ == "NOUN" and token.tag_ not in ("NN", "NNS", "NNP", "NNPS"):
#                 grammar_errors += 1
#             elif token.pos_ == "VERB" and token.tag_ not in (
#                 "VB",
#                 "VBD",
#                 "VBG",
#                 "VBN",
#                 "VBP",
#                 "VBZ",
#             ):
#                 grammar_errors += 1
#             elif token.pos_ == "ADJ" and token.tag_ not in ("JJ", "JJR", "JJS"):
#                 grammar_errors += 1
#             elif token.pos_ == "ADV" and token.tag_ not in ("RB", "RBR", "RBS"):
#                 grammar_errors += 1
#         if token.text in (".", "!", "?"):
#             readability_score += 1
#     readability_score = readability_score / len(doc)
#     if grammar_errors > 5:
#         return -2
#     elif readability_score < 0.2:
#         return 0
#     else:
#         return 2


def scrapeData(soup: BeautifulSoup, obj: dict, es_client: Elasticsearch):
    if not obj.get("url"):
        return
    data = {}
    meta = getMetaTags(soup)
    robots = Robots(getArrayFromString(meta.get("robots", "")))
    if robots.canIndex():
        parsedUrl = parse_url(obj.get("url"))
        isGoogleSearch = (
            True
            if parsedUrl
            and ("google" in parsedUrl.host and "search" in (parsedUrl.path or ""))
            else False
        )
        data["url"] = obj.get("url")

        data["meta"] = meta
        data["title"] = cleanText((soup.find("title")).get_text())
        data["openGraph"] = getOg(soup)
        jsonSchema = getJsonSchema(soup, obj.get("url"), data["title"], es_client)
        data["data"] = jsonSchema
        data["description"] = cleanText(
            meta.get("description", "")
            or jsonSchema.get("description", "")
            or data.get("openGraph").get("description", "")
        )
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
        favicon_link = soup.find("link", rel=["icon", "shortcut icon"])

        if favicon_link:
            data["favicon_url"] = favicon_link["href"]
        data["paragraph"] = [cleanText(a.get_text()) for a in soup.find_all("p")]
        if "wikipedia.org" in obj.get("url", ""):
            wiki = []
            infobox = soup.find("table", class_="infobox")
            # Extract the data from the infobox
            if infobox:
                for row in infobox.find_all("tr"):
                    if row.find("th"):
                        key = cleanText(row.find("th").text)
                        key = re.sub(r"\(see .*?\)", "", key)
                        value = cleanText(row.find("td").text) if row.find("td") else ""
                        images = getImages(row, parsedUrl)
                        wiki.append([key, value, *[x.get("src") for x in images]])
                data["infobox"] = wiki
        if len(data["description"]) < 150:
            data["description"] = cleanText(
                data["description"]
                + "\n"
                + "\n".join(data["paragraph"])
                + ".\n"
                + "\n".join(data["headings"].values())
            )[:2000]
        if (
            not obj["url"].startswith("https://google.com/search?q=")
            and data["title"]
            and data["description"]
        ):
            if not isGoogleSearch:
                es_client.index(index="data", document=data, id=data.get("url"))

            for img in images:
                if img.get("src"):
                    if check_remote_image(img.get("src")):
                        es_client.index(
                            index="images",
                            document={
                                "src": img["src"],
                                "alt": img.get("alt", data.get("title")),
                                "url": img.get("url", data.get("url")),
                                "icon": data.get("favicon_url"),
                            },
                            id=img["src"],
                        )
        print("URL crawled: {}".format(data.get("url")))
        return {
            "queue": getUniqueUrlForQueue(
                [
                    *contextualLinks,
                    *divLinks,
                    *internalLinks,
                    *externalLinks,
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


def getJsonSchema(soup: BeautifulSoup, url: str, title: str, es_client: Elasticsearch):
    json_schema = soup.find_all("script", attrs={"type": "application/ld+json"})
    schemas = []
    others = []
    try:
        for schema in json_schema:
            s = fixJSONLD(json.loads(schema.get_text()))
            if s.get("@type") == "BreadcrumbList":
                continue
            if s.get("@type") in [
                "NewsArticle",
                "VideoObject",
                "Article",
                "ReportageNewsArticle",
            ]:
                schemas.append(s)
            else:
                others.append(s)
        if len(schemas) == 0 and len(json_schema) > 0:
            return fixJSONLD(json.loads(json_schema[0].get_text()))
        if len(schemas) > 1:
            for s in [*schemas, *others][1:]:
                es_client.index(
                    index="data",
                    document={"url": url, "title": title, "data": s},
                    id=url + s.get("type"),
                )
            return schemas[0]
        return schemas[0] if len(schemas) > 0 else {}
    except Exception as e:
        print(e)
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
        headings[str(x)[1:3]] = cleanText(x.get_text())
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
    if parsedUrl and (
        "google" in parsedUrl.host and "search" in (parsedUrl.path or "")
    ):
        results = soup.find_all("div", class_="g")
        links = []
        for result in results:
            link = formatUrl(result.find("a").get("href", ""), parsedUrl.host)
            links.append({"link": link})
        return links
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
    isGoogleSearch = (
        True
        if parsedUrl
        and ("google" in parsedUrl.host and "search" in (parsedUrl.path or ""))
        else False
    )
    images = []
    for image in soup.find_all("img"):
        srcset = image.get("srcset")
        if srcset:
            src_list = srcset.split(", ")
            highest_quality_src = src_list[-1].split(" ")[0]
            src = formatUrl(highest_quality_src, parsedUrl.host)
        elif image.get("src"):
            src = formatUrl(image.get("src"), parsedUrl.host)
        else:
            src = ""
        if src:
            alt = image.get("alt", None)
            if isGoogleSearch:
                parent_text = image.find_parent("div", class_="g")
                if parent_text:
                    parent_text = parent_text.find("h3")
                    if parent_text:
                        alt = parent_text.text

            parent_a = image.find_parent("a")
            url = formatUrl(parent_a.get("href"), parsedUrl.host) if parent_a else None
            images.append({"src": src, "url": url, "alt": alt})
    return images


def getVideos(soup: BeautifulSoup, parsedUrl: Url):
    videos_ = []
    videos = soup.find_all("video")
    for video in videos:
        if video.get("src"):
            url = formatUrl(video.get("src", ""), parsedUrl.host)
            if check_remote_image(url):
                videos_.append({"src": url})
        else:
            for source in video.find_all("source"):
                url = formatUrl(source.get("src", ""), parsedUrl.host)
                if check_remote_image(url):
                    videos_.append({"src": url})
                    break

    return videos_


def fixJSONLD(jsonSchema: dict):
    if not jsonSchema:
        return {}
    return {
        **jsonSchema,
        "logo": getjsonldobject(jsonSchema, "logo", "url"),
        "image": getjsonldobject(jsonSchema, "image", "url"),
        "type": jsonSchema.get("@type"),
        "publisher": {
            **(jsonSchema.get("publisher", {})),
            "logo": getjsonldobject(jsonSchema.get("publisher", {}), "logo", "url"),
        },
        "potentialAction": {
            **(jsonSchema.get("potentialAction", {})),
            "target": jsonSchema.get("potentialAction", {})
            .get("target", {})
            .get("urlTemplate", "")
            if type(jsonSchema.get("potentialAction", {}).get("target")) == dict
            else jsonSchema.get("potentialAction", {}).get("target", ""),
        },
        "mainEntity": getjsonldobject(jsonSchema, "mainEntity", "name"),
        "itemListElement": [],
        "author": getjsonldobject(jsonSchema, "author", "name"),
        "@graph": [],
        "mainEntityOfPage": jsonSchema.get("mainEntityOfPage", {}).get("@id")
        if type(jsonSchema.get("mainEntityOfPage", {})) == dict
        else jsonSchema.get("mainEntityOfPage", ""),
    }


def getjsonldobject(jsonSchema: dict, key: str, ikey: str):
    return (
        {ikey: jsonSchema.get(key, "")}
        if type(jsonSchema.get(key, {})) == str
        else jsonSchema.get(key, {})
    )


# def getDataRank(data: dict):
#     rank = 1
#     if data["title"]:
#         rank += 1
#     else:
#         rank -= 1

#     if data["description"]:
#         rank += 0.5
#     else:
#         rank -= 0.5

#     text = (
#         data["description"]
#         + "\n".join(data["headings"].values())
#         + "\n".join(data["paragraph"])
#     )
#     rank += determine_text_quality(text)
#     return rank
