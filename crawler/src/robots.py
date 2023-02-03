class Robots:
    def __init__(self, content: list) -> None:
        self.content = content

    def all(self):
        return "all" in self.content or len(self.content) == 0

    def canIndex(self):
        return self.all() or (
            "noindex" not in self.content and "none" not in self.content
        )

    def canOpenLink(self):
        return self.all() or (
            "nofollow" not in self.content and "none" not in self.content
        )

    def canIndexImages(self):
        return self.all() or "noimageindex" not in self.content
